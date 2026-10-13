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
 * Chạy `Main` (gọi hàm của sinh viên trong Solution) dưới trình gỡ lỗi JDI và ghi lại từng dòng được thực thi.
 *
 * Cách gọi: java Tracer <classpath> <trace_path> <max_steps> <tên hàm> <tham số của Main...>
 * Mỗi dòng của trace_path là một bản ghi JSON: step / error / done.
 */
public class Tracer {
  static final String SOLUTION = "Solution";
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

  public static void main(String[] args) throws Exception {
    String classpath = args[0];
    out = new PrintWriter(args[1], "UTF-8");
    maxSteps = Integer.parseInt(args[2]);
    StringBuilder mainArgs = new StringBuilder("Main");
    entryName = args[3];
    for (int i = 4; i < args.length; i++) mainArgs.append(' ').append(args[i]);

    LaunchingConnector connector = Bootstrap.virtualMachineManager().defaultConnector();
    Map<String, Connector.Argument> arguments = connector.defaultArguments();
    arguments.get("main").setValue(mainArgs.toString());
    arguments.get("options").setValue("-Xmx128m -XX:+UseSerialGC -cp \"" + classpath + "\"");
    vm = connector.launch(arguments);
    Thread stdout = pipe(vm.process().getInputStream(), System.out);
    Thread stderr = pipe(vm.process().getErrorStream(), System.err);

    EventRequestManager requests = vm.eventRequestManager();
    ClassPrepareRequest prepare = requests.createClassPrepareRequest();
    prepare.addClassFilter(SOLUTION);
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
      stepRequest.addClassFilter(SOLUTION);
      stepRequest.enable();
      entry.request().disable();
      begin(thread);
    } else if (event instanceof StepEvent) {
      ThreadReference thread = ((StepEvent) event).thread();
      finish();
      begin(thread);
    } else if (event instanceof MethodExitEvent) {
      MethodExitEvent exit = (MethodExitEvent) event;
      if (stepRequest == null || !exit.method().name().equals(entryName)) return;
      if (exit.thread().frameCount() != entryDepth) return;
      finish();
      requests.deleteEventRequest(stepRequest);
      exit.request().disable();
      // Giá trị trả về của hàm (index với thuật toán tìm kiếm); hàm void thì là null.
      Value returned = exit.returnValue();
      String result = returned instanceof com.sun.jdi.IntegerValue
          ? String.valueOf(((com.sun.jdi.IntegerValue) returned).value()) : "null";
      out.println("{\"t\":\"done\",\"final\":" + readArray() + ",\"result\":" + result + "}");
      out.flush();
    } else if (event instanceof ExceptionEvent) {
      ExceptionEvent exception = (ExceptionEvent) event;
      finish();
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
  static void finish() {
    if (pendingLine < 0) return;
    out.println("{\"t\":\"step\",\"line\":" + pendingLine + ",\"array\":" + readArray()
        + ",\"locals\":" + pendingLocals + ",\"aliases\":" + pendingAliases + "}");
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
      if (location.declaringType().name().equals(SOLUTION)) return location.lineNumber() - 1;
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
