"""Script gdb: ghi lại biến cục bộ của code C++ sinh viên ở từng step.

Có hai chế độ (biến MODE):
  - 'begin' (mặc định, thuật toán trên mảng): runtime (cpp_runtime.h) gọi __dsa::begin() mỗi khi bắt
    đầu một step mới; ở đó script đọc biến SAU khi dòng trước chạy xong (frame của dòng trước, nếu vẫn
    là cùng một lần gọi hàm), hoặc biến TRƯỚC khi dòng đó chạy nếu frame đã return. Mỗi bản ghi chỉ có
    biến; dòng và mảng lấy từ trace của runtime theo đúng thứ tự step.
  - 'lines' (danh sách liên kết, không có truy cập mảng để runtime bắt): gdb tự đi từng dòng của hàm
    ENTRY bằng lệnh step; mỗi bản ghi là một step đầy đủ (dòng, biến, các node đi tới được).
Kết quả ghi vào VARS_PATH (NDJSON).

Cách gọi: gdb -nx -q -batch -ex "python VARS_PATH=r'...'" -x cpp_vars.py --args <chương trình> <tham số...>
  (chế độ 'lines' thêm: MODE='lines'; ENTRY='SLL::insertAtHead'; MAX_STEPS=3000; SOLUTION_FILE='SLL.cpp')
"""
import json
import re

import gdb

# File code sinh viên (chế độ 'lines' với project Singly Linked List: SLL.cpp).
SOLUTION_FILE = globals().get('SOLUTION_FILE', 'solution.cpp')
MAX_LIST_ITEMS = 20
MAX_NODES = 60
NODE_TYPE = 'Node'
MODE = globals().get('MODE', 'begin')

out = open(VARS_PATH, 'w', encoding='utf-8')  # noqa: F821 (VARS_PATH do lệnh gdb truyền vào)


def emit(record):
    out.write(json.dumps(record) + '\n')
    out.flush()


def in_solution(frame):
    sal = frame.find_sal()
    return sal.symtab is not None and sal.symtab.filename.replace('\\', '/').endswith(SOLUTION_FILE)


def user_frames(frame):
    """Các frame thuộc code sinh viên, từ trong ra ngoài."""
    while frame is not None:
        if in_solution(frame):
            yield frame
        frame = frame.older()


def vector_items(vector):
    """Phần tử của một std::vector (đọc trực tiếp cấu trúc của libstdc++)."""
    impl = vector['_M_impl']
    start, finish = impl['_M_start'], impl['_M_finish']
    length = int(finish - start)
    return [describe(start[i]) for i in range(min(length, MAX_LIST_ITEMS))], length


def is_node_pointer(value):
    value_type = value.type.strip_typedefs()
    return value_type.code == gdb.TYPE_CODE_PTR and str(value_type.target().strip_typedefs()) == NODE_TYPE


def walk(pointer):
    """(địa chỉ, node) đi theo next từ con trỏ `pointer` (dừng ở nullptr, vòng lặp hoặc vùng nhớ lỗi)."""
    seen = set()
    while len(seen) < MAX_NODES:
        address = int(pointer)
        if address == 0 or address in seen:
            return
        seen.add(address)
        try:
            node = pointer.dereference()
            next_pointer = node['next']
            node['val'].fetch_lazy()
        except (gdb.error, gdb.MemoryError):
            return
        yield address, node
        pointer = next_pointer


def describe(value):
    value_type = value.type.strip_typedefs()
    if value_type.code == gdb.TYPE_CODE_REF or value_type.code == gdb.TYPE_CODE_RVALUE_REF:
        value = value.referenced_value()
        value_type = value.type.strip_typedefs()
    code = value_type.code
    if is_node_pointer(value):
        for address, node in walk(value):
            return {'node': str(address), 'val': describe(node['val'])}
        return None
    if code == gdb.TYPE_CODE_PTR:
        return 'nullptr' if int(value) == 0 else str(value_type)
    if code == gdb.TYPE_CODE_BOOL:
        return bool(value)
    if code == gdb.TYPE_CODE_CHAR:
        return "'%s'" % chr(int(value) & 0xFF)
    if code in (gdb.TYPE_CODE_INT, gdb.TYPE_CODE_ENUM):
        return int(value)
    if code == gdb.TYPE_CODE_FLT:
        number = float(value)
        return number if number == number and abs(number) != float('inf') else str(number)
    if code == gdb.TYPE_CODE_ARRAY:
        low, high = value_type.range()
        items = [describe(value[i]) for i in range(low, min(high + 1, low + MAX_LIST_ITEMS))]
        return {'list': items, 'length': high - low + 1}
    name = str(value_type)
    if name.startswith('__dsa::Vec<'):
        items, length = vector_items(value['d'])
        return {'list': items, 'length': length}
    if name.startswith('std::vector<'):
        items, length = vector_items(value)
        return {'list': items, 'length': length}
    return name


def is_traced_array(value):
    value_type = value.type.strip_typedefs()
    if value_type.code in (gdb.TYPE_CODE_REF, gdb.TYPE_CODE_RVALUE_REF):
        value = value.referenced_value()
        value_type = value.type.strip_typedefs()
    return str(value_type).startswith('__dsa::Vec<') and bool(value['traced'])


def frame_values(frame):
    """(tên, giá trị) của các biến đã khai báo (trước dòng frame đang đứng) trong mọi block đang mở."""
    seen = set()
    try:
        line = frame.find_sal().line
        block = frame.block()
    except RuntimeError:
        return
    while block is not None:
        for symbol in block:
            if not (symbol.is_variable or symbol.is_argument) or symbol.name in seen:
                continue
            # gdb liệt kê cả biến khai báo ở dòng sau (chưa được gán): bỏ qua chúng.
            if not symbol.is_argument and symbol.line >= line:
                continue
            seen.add(symbol.name)
            try:
                value = symbol.value(frame)
                if symbol.name == 'this':
                    # Trong phương thức của SLL, sinh viên viết `head` (field của this): coi như một biến.
                    target = value.dereference()
                    if any(field.name == 'head' for field in target.type.strip_typedefs().fields()):
                        yield 'head', target['head']
                    continue
                yield symbol.name, value
            except (gdb.error, gdb.MemoryError, RuntimeError, ValueError):
                continue
        if block.function is not None:
            break
        block = block.superblock


def variables(frame):
    result = {}
    for name, value in frame_values(frame):
        try:
            if is_traced_array(value):
                continue
            result[name] = describe(value)
        except (gdb.error, gdb.MemoryError, RuntimeError, ValueError):
            continue
    return result


def heap(frame):
    """Các node đi tới được từ biến con trỏ Node* của frame: [{id, val, next}]."""
    nodes, seen = [], set()
    for _, value in frame_values(frame):
        if not is_node_pointer(value):
            continue
        for address, node in walk(value):
            if address in seen:
                break
            seen.add(address)
            next_address = int(node['next'])
            nodes.append({'id': str(address), 'val': describe(node['val']),
                          'next': str(next_address) if next_address else None})
    return nodes


# Đệ quy sâu hơn mức này thì dừng chương trình và báo lỗi (thường là đệ quy không có điểm dừng).
MAX_DEPTH = 10000


def frame_key(frame):
    """Định danh một frame: tên hàm + frame pointer (không đổi suốt thân hàm khi biên dịch -O0)."""
    function = frame.function()
    return (function.name if function else '', int(frame.read_register('fp')))


# Mỗi lần gọi hàm của sinh viên có một số thứ tự riêng: phân biệt hai lần gọi trùng frame
# (vd. mergeSort trái vừa return rồi mergeSort phải được gọi ở đúng chỗ đó trên stack).
activations = {}
next_activation = [0]
too_deep = [False]


def activation_of(frame):
    return activations.get(frame_key(frame))


class EntryBreakpoint(gdb.Breakpoint):
    def stop(self):
        activations[frame_key(gdb.selected_frame())] = next_activation[0]
        next_activation[0] += 1
        # Frame của các lần gọi đã return được ghi đè khi vị trí đó trên stack được dùng lại,
        # nên số khóa xấp xỉ độ sâu đệ quy lớn nhất.
        if len(activations) > MAX_DEPTH:
            too_deep[0] = True
            return True
        return False


pending = [None]


def finish_pending(current_user_frames):
    step = pending[0]
    if step is None:
        return
    key, serial, scope, before = step
    after = None
    for candidate in current_user_frames:
        if frame_key(candidate) == key and activation_of(candidate) == serial:
            after = variables(candidate)
            break
    emit({'scope': scope, 'vars': after if after is not None else before})
    pending[0] = None


class BeginBreakpoint(gdb.Breakpoint):
    def stop(self):
        frames = list(user_frames(gdb.selected_frame()))
        finish_pending(frames)
        if frames:
            frame = frames[0]
            function = frame.function()
            pending[0] = (frame_key(frame), activation_of(frame),
                          function.name.split('(')[0] if function else '', variables(frame))
        return False


def scope_of(frame):
    function = frame.function()
    return function.name.split('(')[0] if function else ''


def is_alive():
    return gdb.selected_inferior().pid != 0


def run_lines():
    """Chế độ 'lines': đi từng dòng của hàm ENTRY (và các hàm sinh viên nó gọi) bằng lệnh step."""
    stop_signal = [None]

    def on_stop(event):
        if isinstance(event, gdb.SignalEvent):
            stop_signal[0] = event.stop_signal

    gdb.events.stop.connect(on_stop)
    gdb.Breakpoint(ENTRY, internal=True)  # noqa: F821 (ENTRY do lệnh gdb truyền vào)
    gdb.execute('run', to_string=True)

    # Dòng đang chạy: (frame key, dòng 0-based, tên hàm, biến và node lúc dòng bắt đầu).
    current = None
    returned_to_line = False
    count = 0

    def finish_current(frame):
        # Trạng thái SAU khi dòng chạy xong nếu vẫn ở cùng frame; không thì dùng trạng thái lúc bắt đầu.
        key, line, scope, before_vars, before_heap = current
        same = frame is not None and frame_key(frame) == key
        emit({'t': 'step', 'line': line, 'scope': scope, 'array': [], 'reads': [], 'writes': [],
              'vars': variables(frame) if same else before_vars,
              'heap': heap(frame) if same else before_heap})

    while is_alive() and stop_signal[0] is None:
        frame = gdb.selected_frame()
        if in_solution(frame):
            line = frame.find_sal().line - 1
            key = frame_key(frame)
            # Quay lại đúng dòng đang chạy sau khi `finish` ra khỏi hàm khác (vd. constructor của Node):
            # vẫn là cùng một dòng, không tính là step mới.
            if not (returned_to_line and current and current[0] == key and current[1] == line):
                if current:
                    finish_current(frame)
                count += 1
                if count > MAX_STEPS:  # noqa: F821
                    emit({'t': 'error', 'kind': 'limit', 'line': line, 'message': ''})
                    gdb.execute('kill')
                    return
                current = (key, line, scope_of(frame), variables(frame), heap(frame))
            returned_to_line = False
            gdb.execute('step', to_string=True)
        elif any(in_solution(f) for f in user_frames(frame)):
            # Đang ở trong code không phải của sinh viên (runtime, constructor của Node...): chạy cho xong.
            gdb.execute('finish', to_string=True)
            returned_to_line = True
        else:
            break

    if current:
        finish_current(None)
    if stop_signal[0] is not None:
        frames = list(user_frames(gdb.selected_frame()))
        emit({'t': 'signal', 'signal': stop_signal[0],
              'line': frames[0].find_sal().line - 1 if frames else None})
        gdb.execute('kill')
    elif is_alive():
        # Hàm đã return về main: chạy nốt để main ghi kết quả.
        gdb.execute('continue', to_string=True)


gdb.execute('set pagination off')
gdb.execute('set confirm off')
gdb.execute('set print inferior-events off')
gdb.execute('set print thread-events off')
# Trong container không tắt được ASLR; không cần cho việc đọc biến.
gdb.execute('set disable-randomization off')

if MODE == 'lines':
    run_lines()
    out.close()
    raise SystemExit

# Đặt breakpoint ở đầu mọi hàm trong code sinh viên (sau phần prologue).
seen_lines = set()
functions = gdb.execute('info functions -q -n', to_string=True)
in_file = False
for text in functions.splitlines():
    header = re.match(r'^File (.*):$', text.strip())
    if header:
        in_file = header.group(1).replace('\\', '/').endswith(SOLUTION_FILE)
        continue
    match = re.match(r'^\s*(\d+):', text)
    if in_file and match and match.group(1) not in seen_lines:
        seen_lines.add(match.group(1))
        EntryBreakpoint('-source %s -line %s' % (SOLUTION_FILE, match.group(1)), internal=True)

BeginBreakpoint('__dsa::begin', internal=True)

gdb.execute('run', to_string=True)

# Chương trình đã kết thúc (hoặc dừng vì lỗi): ghi nốt step cuối bằng giá trị lúc dòng đó bắt đầu.
finish_pending([])
status = gdb.execute('info program', to_string=True)
signal = re.search(r'signal (\w+)', status)
if too_deep[0] or signal:
    frames = list(user_frames(gdb.selected_frame()))
    emit({'t': 'signal', 'signal': 'RECURSION' if too_deep[0] else signal.group(1),
          'line': frames[0].find_sal().line - 1 if frames else None})
    gdb.execute('kill')
out.close()
