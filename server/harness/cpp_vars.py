"""Script gdb: ghi lại biến cục bộ của code C++ sinh viên ở từng step.

Runtime (cpp_runtime.h) gọi __dsa::begin() mỗi khi bắt đầu một step mới; ở đó script đọc:
  - biến SAU khi dòng trước chạy xong (frame của dòng trước, nếu vẫn là cùng một lần gọi hàm),
  - biến TRƯỚC khi dòng mới chạy (dùng khi frame của dòng đó đã return).
Kết quả ghi vào VARS_PATH (NDJSON, một bản ghi mỗi step, theo đúng thứ tự step của runtime).

Cách gọi: gdb -nx -q -batch -ex "python VARS_PATH=r'...'" -x cpp_vars.py --args <chương trình> <tham số...>
"""
import json
import re

import gdb

SOLUTION_FILE = 'solution.cpp'
MAX_LIST_ITEMS = 20

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


def describe(value):
    value_type = value.type.strip_typedefs()
    if value_type.code == gdb.TYPE_CODE_REF or value_type.code == gdb.TYPE_CODE_RVALUE_REF:
        value = value.referenced_value()
        value_type = value.type.strip_typedefs()
    code = value_type.code
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


def variables(frame):
    """Biến đã khai báo (trước dòng frame đang đứng) trong mọi block đang mở của hàm."""
    result = {}
    try:
        line = frame.find_sal().line
        block = frame.block()
    except RuntimeError:
        return result
    while block is not None:
        for symbol in block:
            if not (symbol.is_variable or symbol.is_argument) or symbol.name in result:
                continue
            # gdb liệt kê cả biến khai báo ở dòng sau (chưa được gán): bỏ qua chúng.
            if not symbol.is_argument and symbol.line >= line:
                continue
            try:
                value = symbol.value(frame)
                if is_traced_array(value):
                    continue
                result[symbol.name] = describe(value)
            except (gdb.error, RuntimeError, ValueError):
                continue
        if block.function is not None:
            break
        block = block.superblock
    return result


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


gdb.execute('set pagination off')
gdb.execute('set confirm off')
gdb.execute('set print inferior-events off')
gdb.execute('set print thread-events off')
# Trong container không tắt được ASLR; không cần cho việc đọc biến.
gdb.execute('set disable-randomization off')

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
