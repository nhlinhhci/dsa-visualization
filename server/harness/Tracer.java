import com.sun.jdi.AbsentInformationException;
import com.sun.jdi.ArrayReference;
import com.sun.jdi.Bootstrap;
import com.sun.jdi.Field;
import com.sun.jdi.LocalVariable;
import com.sun.jdi.Location;
import com.sun.jdi.ObjectReference;
import com.sun.jdi.PrimitiveValue;
import com.sun.jdi.ReferenceType;
import com.sun.jdi.StackFrame;
import com.sun.jdi.StringReference;
import com.sun.jdi.ThreadReference;
import com.sun.jdi.VMDisconnectedException;
import com.sun.jdi.Value;
import com.sun.jdi.VirtualMachine;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.event.ClassPrepareEvent;
import com.sun.jdi.event.Event;
import com.sun.jdi.event.EventSet;
import com.sun.jdi.event.ExceptionEvent;
import com.sun.jdi.event.MethodEntryEvent;
import com.sun.jdi.event.MethodExitEvent;
import com.sun.jdi.event.StepEvent;
import com.sun.jdi.event.VMDeathEvent;
import com.sun.jdi.event.VMDisconnectEvent;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.ExceptionRequest;
import com.sun.jdi.request.MethodEntryRequest;
import com.sun.jdi.request.MethodExitRequest;
import com.sun.jdi.request.StepRequest;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

/**
 * Chạy `Main` (gọi hàm của sinh viên) dưới trình gỡ lỗi JDI và ghi lại từng dòng được thực thi trong class
 * của sinh viên (`Solution` với thuật toán trên mảng, `SLL` với project Singly Linked List).
 *
 * Cách gọi: java Tracer <classpath> <trace_path> <max_steps> <class> <tên hàm> <tham số của Main...>
 * Nếu Main có field tĩnh `list` (object SLL), kết quả là danh sách đi từ `list.head` sau khi hàm chạy xong.
 * Mỗi dòng của trace_path là một bản ghi JSON: step / error / done.
 */
public class Tracer {
  static String solutionClass;
  static String entryName;

  static VirtualMachine vm;
  static PrintWriter out;
  static int maxSteps;
  static int stepCount = 0;
  static boolean running = true;

  static StepRequest stepRequest;
  static int entryDepth;
  // Dòng đang chạy (0-based) và các biến cục bộ tại thời điểm dòng đó bắt đầu; -1 nếu không có.
  static int pendingLine = -1;
  static String pendingLocals = "{}";
  static String pendingAliases = "[]";
  // Độ sâu stack, tên hàm và biến của dòng đang chạy, để đọc lại đúng frame đó khi dòng chạy xong.
  static int pendingDepth;
  static String pendingScope = "";
  static String pendingVars = "{}";
  static String pendingHeap = "[]";
  // Node của danh sách liên kết: lớp `Node` có field `val` và `next`.
  static final String NODE_CLASS = "Node";
  static final int MAX_NODES = 60;
  static final int MAX_LIST_ITEMS = 20;

  public static void main(String[] args) throws Exception {
    String classpath = args[0];
    out = new PrintWriter(args[1], "UTF-8");
    maxSteps = Integer.parseInt(args[2]);
    StringBuilder mainArgs = new StringBuilder("Main");
    solutionClass = args[3];
    entryName = args[4];
    for (int i = 5; i < args.length; i++) mainArgs.append(' ').append(args[i]);

    LaunchingConnector connector = Bootstrap.virtualMachineManager().defaultConnector();
    Map<String, Connector.Argument> arguments = connector.defaultArguments();
    arguments.get("main").setValue(mainArgs.toString());
    arguments.get("options").setValue("-Xmx128m -XX:+UseSerialGC -cp \"" + classpath + "\"");
    vm = connector.launch(arguments);
    Thread stdout = pipe(vm.process().getInputStream(), System.out);
    Thread stderr = pipe(vm.process().getErrorStream(), System.err);

    EventRequestManager requests = vm.eventRequestManager();
    ClassPrepareRequest prepare = requests.createClassPrepareRequest();
    prepare.addClassFilter(solutionClass);
    prepare.enable();
    ExceptionRequest uncaught = requests.createExceptionRequest(null, false, true);
    uncaught.enable();

    try {
      while (running) {
        EventSet events = vm.eventQueue().remove();
        for (Event event : events) handle(event);
        if (running) events.resume();
      }
    } catch (VMDisconnectedException e) {
      // VM đã thoát.
    }
    // Chờ chuyển hết output của chương trình trước khi thoát.
    stdout.join(1000);
    stderr.join(1000);
    out.close();
  }

  static void handle(Event event) throws Exception {
    EventRequestManager requests = vm.eventRequestManager();
    if (event instanceof ClassPrepareEvent) {
      ReferenceType type = ((ClassPrepareEvent) event).referenceType();
      MethodEntryRequest entry = requests.createMethodEntryRequest();
      entry.addClassFilter(type);
      entry.enable();
      MethodExitRequest exit = requests.createMethodExitRequest();
      exit.addClassFilter(type);
      exit.enable();
    } else if (event instanceof MethodEntryEvent) {
      MethodEntryEvent entry = (MethodEntryEvent) event;
      if (stepRequest != null || !entry.method().name().equals(entryName)) return;
      ThreadReference thread = entry.thread();
      entryDepth = thread.frameCount();
      stepRequest = requests.createStepRequest(thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO);
      stepRequest.addClassFilter(solutionClass);
      stepRequest.enable();
      entry.request().disable();
      begin(thread);
    } else if (event instanceof StepEvent) {
      ThreadReference thread = ((StepEvent) event).thread();
      finish(thread);
      begin(thread);
    } else if (event instanceof MethodExitEvent) {
      MethodExitEvent exit = (MethodExitEvent) event;
      if (stepRequest == null || !exit.method().name().equals(entryName)) return;
      if (exit.thread().frameCount() != entryDepth) return;
      finish(exit.thread());
      requests.deleteEventRequest(stepRequest);
      exit.request().disable();
      // Giá trị trả về của hàm (index với thuật toán tìm kiếm); hàm void thì là null.
      // Project danh sách liên kết: kết quả là các giá trị đi theo next từ `Main.list.head`.
      Value returned = exit.returnValue();
      ReferenceType main = vm.classesByName("Main").get(0);
      Field listField = main.fieldByName("list");
      if (listField != null) {
        ObjectReference list = (ObjectReference) main.getValue(listField);
        Value head = list == null ? null : list.getValue(list.referenceType().fieldByName("head"));
        ObjectReference resultNode = isNode(head) ? (ObjectReference) head : null;
        StringBuilder values = new StringBuilder("[");
        for (ObjectReference node : walk(resultNode)) {
          if (values.length() > 1) values.append(',');
          values.append(describe(node.getValue(node.referenceType().fieldByName("val"))));
        }
        out.println("{\"t\":\"done\",\"final\":" + values.append(']') + ",\"result\":null,\"resultNode\":"
            + (resultNode == null ? "null" : String.valueOf(resultNode.uniqueID())) + "}");
      } else {
        String result = returned instanceof com.sun.jdi.IntegerValue
            ? String.valueOf(((com.sun.jdi.IntegerValue) returned).value()) : "null";
        out.println("{\"t\":\"done\",\"final\":" + readArray() + ",\"result\":" + result + "}");
      }
      out.flush();
    } else if (event instanceof ExceptionEvent) {
      ExceptionEvent exception = (ExceptionEvent) event;
      finish(exception.thread());
      error("runtime", solutionLine(exception.thread()), describe(exception.exception()));
    } else if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
      running = false;
    }
  }

  /** Bắt đầu một dòng mới: ghi nhớ số dòng và biến cục bộ trước khi dòng đó chạy. */
  static void begin(ThreadReference thread) throws Exception {
    StackFrame frame = thread.frame(0);
    int line = frame.location().lineNumber() - 1;
    if (++stepCount > maxSteps) {
      error("limit", line, "");
      return;
    }
    pendingLine = line;
    pendingDepth = thread.frameCount();
    pendingScope = frame.location().method().name();
    pendingVars = variables(frame);
    pendingHeap = heap(frame);
    long dataId = dataArray().uniqueID();
    StringBuilder locals = new StringBuilder("{");
    StringBuilder aliases = new StringBuilder("[");
    try {
      for (LocalVariable variable : frame.visibleVariables()) {
        Value value = frame.getValue(variable);
        if (value instanceof PrimitiveValue && !(value instanceof com.sun.jdi.BooleanValue)
            && !(value instanceof com.sun.jdi.FloatValue) && !(value instanceof com.sun.jdi.DoubleValue)) {
          if (locals.length() > 1) locals.append(',');
          locals.append('"').append(variable.name()).append("\":").append(((PrimitiveValue) value).longValue());
        } else if (value instanceof ArrayReference && ((ArrayReference) value).uniqueID() == dataId) {
          if (aliases.length() > 1) aliases.append(',');
          aliases.append('"').append(variable.name()).append('"');
        }
      }
    } catch (AbsentInformationException e) {
      // Không có thông tin debug: bỏ qua biến cục bộ.
    }
    pendingLocals = locals.append('}').toString();
    pendingAliases = aliases.append(']').toString();
  }

  /** Kết thúc dòng đang chạy: ghi step với trạng thái mảng sau khi dòng đó thực thi. */
  static void finish(ThreadReference thread) throws Exception {
    if (pendingLine < 0) return;
    // Biến lấy SAU khi dòng chạy xong: frame của dòng đó vẫn còn trên stack nếu hàm chưa return
    // (có thể nằm dưới frame của hàm vừa được gọi); nếu đã return thì dùng giá trị lúc dòng bắt đầu.
    String vars = pendingVars;
    String nodes = pendingHeap;
    int depth = thread.frameCount();
    if (depth >= pendingDepth) {
      StackFrame frame = thread.frame(depth - pendingDepth);
      vars = variables(frame);
      nodes = heap(frame);
    }
    out.println("{\"t\":\"step\",\"line\":" + pendingLine + ",\"array\":" + readArray()
        + ",\"locals\":" + pendingLocals + ",\"aliases\":" + pendingAliases
        + ",\"scope\":\"" + escape(pendingScope) + "\",\"vars\":" + vars
        + (nodes.equals("[]") ? "" : ",\"heap\":" + nodes) + "}");
    out.flush();
    pendingLine = -1;
  }

  static void error(String kind, int line, String message) {
    out.println("{\"t\":\"error\",\"kind\":\"" + kind + "\",\"line\":" + line + ",\"message\":\""
        + escape(message) + "\"}");
    out.flush();
    running = false;
    vm.exit(1);
  }

  /** Field `head` của object đang chạy phương thức (`this` là SLL), hoặc null nếu không có. */
  static Field headField(StackFrame frame) {
    ObjectReference self = frame.thisObject();
    return self == null ? null : self.referenceType().fieldByName("head");
  }

  /** Biến cục bộ của frame dưới dạng JSON, bỏ qua mảng đang trực quan hóa (đã hiện ở bên trái). */
  static String variables(StackFrame frame) {
    StringBuilder json = new StringBuilder("{");
    try {
      // Trong phương thức của SLL, sinh viên viết `head` (field của this): hiện như một biến.
      Field head = headField(frame);
      if (head != null) json.append("\"head\":").append(describe(frame.thisObject().getValue(head)));
      long dataId = dataArray().uniqueID();
      for (LocalVariable variable : frame.visibleVariables()) {
        Value value = frame.getValue(variable);
        String text;
        if (value instanceof ArrayReference) {
          ArrayReference array = (ArrayReference) value;
          if (array.uniqueID() == dataId) continue;
          StringBuilder items = new StringBuilder("[");
          List<Value> values = array.getValues(0, Math.min(array.length(), MAX_LIST_ITEMS));
          for (int i = 0; i < values.size(); i++) {
            if (i > 0) items.append(',');
            items.append(describe(values.get(i)));
          }
          text = "{\"list\":" + items.append(']') + ",\"length\":" + array.length() + "}";
        } else {
          text = describe(value);
        }
        if (json.length() > 1) json.append(',');
        json.append('"').append(escape(variable.name())).append("\":").append(text);
      }
    } catch (Exception e) {
      // Không có thông tin debug hoặc frame không còn: không hiện biến.
    }
    return json.append('}').toString();
  }

  static boolean isNode(Value value) {
    return value instanceof ObjectReference && ((ObjectReference) value).referenceType().name().equals(NODE_CLASS);
  }

  /** Các node đi theo next từ `start` (dừng nếu gặp vòng lặp). */
  static List<ObjectReference> walk(ObjectReference start) {
    List<ObjectReference> nodes = new java.util.ArrayList<ObjectReference>();
    java.util.Set<Long> seen = new java.util.HashSet<Long>();
    Value current = start;
    while (isNode(current) && nodes.size() < MAX_NODES) {
      ObjectReference node = (ObjectReference) current;
      if (!seen.add(node.uniqueID())) break;
      nodes.add(node);
      current = node.getValue(node.referenceType().fieldByName("next"));
    }
    return nodes;
  }

  /** Các node đi tới được từ biến cục bộ của frame: [{id, val, next}]. */
  static String heap(StackFrame frame) {
    StringBuilder json = new StringBuilder("[");
    java.util.Set<Long> seen = new java.util.HashSet<Long>();
    try {
      // Gốc: field head của SLL (nếu đang trong phương thức của SLL) rồi tới các biến cục bộ.
      List<Value> roots = new java.util.ArrayList<Value>();
      Field head = headField(frame);
      if (head != null) roots.add(frame.thisObject().getValue(head));
      for (LocalVariable variable : frame.visibleVariables()) roots.add(frame.getValue(variable));
      for (Value value : roots) {
        if (!isNode(value)) continue;
        for (ObjectReference node : walk((ObjectReference) value)) {
          if (!seen.add(node.uniqueID())) break;
          Value next = node.getValue(node.referenceType().fieldByName("next"));
          if (json.length() > 1) json.append(',');
          json.append("{\"id\":").append(node.uniqueID())
              .append(",\"val\":").append(describe(node.getValue(node.referenceType().fieldByName("val"))))
              .append(",\"next\":").append(isNode(next) ? String.valueOf(((ObjectReference) next).uniqueID()) : "null")
              .append('}');
        }
      }
    } catch (Exception e) {
      // Không đọc được frame: không hiện node.
    }
    return json.append(']').toString();
  }

  /** Một giá trị JDI dưới dạng JSON: số, true/false, chuỗi có ngoặc kép, node, hoặc tên kiểu. */
  static String describe(Value value) {
    if (value == null) return "null";
    if (isNode(value)) {
      ObjectReference node = (ObjectReference) value;
      return "{\"node\":" + node.uniqueID() + ",\"val\":"
          + describe(node.getValue(node.referenceType().fieldByName("val"))) + "}";
    }
    if (value instanceof com.sun.jdi.BooleanValue) {
      return String.valueOf(((com.sun.jdi.BooleanValue) value).value());
    }
    if (value instanceof com.sun.jdi.CharValue) {
      return quote("'" + ((com.sun.jdi.CharValue) value).value() + "'");
    }
    if (value instanceof com.sun.jdi.FloatValue || value instanceof com.sun.jdi.DoubleValue) {
      double number = ((PrimitiveValue) value).doubleValue();
      return Double.isNaN(number) || Double.isInfinite(number) ? quote(String.valueOf(number)) : String.valueOf(number);
    }
    if (value instanceof PrimitiveValue) return String.valueOf(((PrimitiveValue) value).longValue());
    if (value instanceof StringReference) {
      String text = ((StringReference) value).value();
      return quote("\"" + (text.length() > 40 ? text.substring(0, 40) + "…" : text) + "\"");
    }
    return quote(value.type().name());
  }

  static String quote(String text) {
    return "\"" + escape(text) + "\"";
  }

  static ArrayReference dataArray() {
    ReferenceType main = vm.classesByName("Main").get(0);
    Field field = main.fieldByName("data");
    return (ArrayReference) main.getValue(field);
  }

  static String readArray() {
    List<Value> values = dataArray().getValues();
    StringBuilder json = new StringBuilder("[");
    for (int i = 0; i < values.size(); i++) {
      if (i > 0) json.append(',');
      json.append(((PrimitiveValue) values.get(i)).intValue());
    }
    return json.append(']').toString();
  }

  /** Dòng (0-based) của frame gần nhất nằm trong code sinh viên, hoặc -1. */
  static int solutionLine(ThreadReference thread) throws Exception {
    for (StackFrame frame : thread.frames()) {
      Location location = frame.location();
      if (location.declaringType().name().equals(solutionClass)) return location.lineNumber() - 1;
    }
    return -1;
  }

  static String describe(ObjectReference exception) {
    String name = exception.referenceType().name();
    Field field = exception.referenceType().fieldByName("detailMessage");
    Value message = field == null ? null : exception.getValue(field);
    if (message instanceof StringReference) return name + ": " + ((StringReference) message).value();
    return name;
  }

  static String escape(String text) {
    StringBuilder json = new StringBuilder();
    for (char c : text.toCharArray()) {
      if (c == '"' || c == '\\') json.append('\\').append(c);
      else if (c < 0x20) json.append(' ');
      else json.append(c);
    }
    return json.toString();
  }

  static Thread pipe(final InputStream from, final OutputStream to) {
    Thread thread = new Thread(new Runnable() {
      public void run() {
        byte[] buffer = new byte[4096];
        try {
          int n;
          while ((n = from.read(buffer)) >= 0) {
            to.write(buffer, 0, n);
            to.flush();
          }
        } catch (Exception e) {
          // Tiến trình con đã đóng luồng.
        }
      }
    });
    thread.setDaemon(true);
    thread.start();
    return thread;
  }
}
