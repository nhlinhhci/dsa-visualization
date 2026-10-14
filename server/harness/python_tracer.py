"""Chạy hàm của sinh viên (vd. bubble_sort(arr)) và ghi lại từng dòng được thực thi.

Cách gọi: python python_tracer.py <code_path> <trace_path> <max_steps> <config_json>
config: {"array": [...], "entry": [tên hàm...], "kind": ..., "target": số, "args": [...]}
  kind: "sort" | "sortRange" | "search" | "sllMethod" (xem src/data/algorithmSpecs.js)
Với "sllMethod", file là main.py của project Singly Linked List: "array" là giá trị danh sách ban đầu;
tracer tạo SLL(), gắn danh sách vào head rồi gọi phương thức entry(*args). Mỗi step có thêm "heap":
các node đi tới được từ biến cục bộ (kể cả self.head).
Mỗi dòng của trace_path là một bản ghi JSON: step / error / done.
"""
import json
import sys
import traceback

SOLUTION = '<solution>'


class StepLimit(BaseException):
    pass


MAX_NODES = 60


def is_node(value):
    # Node: object có .val và .next (lớp Node trong main.py).
    return not isinstance(value, type) and hasattr(value, 'val') and hasattr(value, 'next')


def is_list_object(value):
    # Object giữ danh sách (SLL): có .head, không phải node.
    return not isinstance(value, type) and not is_node(value) and hasattr(value, 'head')


def walk(node):
    """Các node đi theo next từ `node` (dừng nếu gặp vòng lặp)."""
    seen = set()
    while is_node(node) and id(node) not in seen and len(seen) < MAX_NODES:
        seen.add(id(node))
        yield node
        node = node.next


def main():
    code_path, trace_path, max_steps, config_json = sys.argv[1:5]
    max_steps = int(max_steps)
    config = json.loads(config_json)
    with open(code_path, encoding='utf-8') as f:
        source = f.read()
    out = open(trace_path, 'w', encoding='utf-8')

    def emit(record):
        out.write(json.dumps(record) + '\n')
        out.flush()

    reads, writes = [], []

    def record(lst, index, bucket):
        n = len(lst)
        if isinstance(index, slice):
            indices = range(*index.indices(n))
        elif isinstance(index, int):
            indices = (index + n if index < 0 else index,)
        else:
            return
        for i in indices:
            if 0 <= i < n and i not in bucket:
                bucket.append(i)

    class TrackedList(list):
        def __getitem__(self, index):
            value = list.__getitem__(self, index)
            record(self, index, reads)
            return value

        def __setitem__(self, index, value):
            list.__setitem__(self, index, value)
            record(self, index, writes)

    # Với danh sách liên kết, `array` là giá trị các node chứ không phải mảng được truyền vào hàm.
    is_list = config['kind'] == 'sllMethod'
    arr = TrackedList([] if is_list else config['array'])

    def snapshot():
        return [
            x if isinstance(x, (int, float)) and not isinstance(x, bool) and x == x else 0
            for x in list.__iter__(arr)
        ]

    MAX_LIST_ITEMS = 20

    def describe(value):
        """Giá trị một biến để hiển thị: số/bool giữ nguyên, list rút gọn, còn lại là chuỗi."""
        if isinstance(value, bool) or value is None:
            return value
        if isinstance(value, int):
            return value if abs(value) < 2 ** 53 else str(value)
        if isinstance(value, float):
            return value if value == value and abs(value) != float('inf') else str(value)
        if isinstance(value, str):
            return repr(value if len(value) <= 40 else value[:40] + '…')
        if is_node(value):
            return {'node': id(value), 'val': describe(value.val)}
        if isinstance(value, (list, tuple)):
            items = list(list.__iter__(value)) if isinstance(value, list) else list(value)
            return {'list': [describe(x) if isinstance(x, (bool, int, float, str)) or x is None
                             else type(x).__name__ for x in items[:MAX_LIST_ITEMS]],
                    'length': len(items)}
        return type(value).__name__

    def variables(frame):
        """Biến cục bộ của frame, bỏ qua mảng đang trực quan hóa (đã hiện ở bên trái) và hàm/module."""
        result = {}
        for name, value in frame.f_locals.items():
            if name.startswith('__') or value is arr or callable(value) or type(value).__name__ == 'module':
                continue
            if is_list_object(value):
                # `self` của SLL: hiện field head (vd. "self.head") thay cho cả object.
                result[name + '.head'] = describe(value.head)
                continue
            result[name] = describe(value)
        return result

    def heap(frame):
        """Các node đi tới được từ biến cục bộ của frame: [{id, val, next}]."""
        nodes, seen = [], set()
        for value in frame.f_locals.values():
            if is_list_object(value):
                value = value.head
            for node in walk(value):
                if id(node) in seen:
                    break
                seen.add(id(node))
                nodes.append({'id': id(node), 'val': describe(node.val),
                              'next': id(node.next) if is_node(node.next) else None})
        return nodes

    # skip: lớp mà phương thức của nó không theo dõi (Node trong main.py — phần chỉ đọc của project).
    state = {'line': None, 'count': 0, 'frame': None, 'skip': None}

    def flush():
        if state['line'] is None:
            return
        # Biến lấy SAU khi dòng chạy xong, cùng thời điểm với trạng thái mảng.
        frame = state['frame']
        record = {'t': 'step', 'line': state['line'], 'array': snapshot(),
                  'reads': reads[:], 'writes': writes[:],
                  'scope': frame.f_code.co_name, 'vars': variables(frame)}
        if is_list:
            record['heap'] = heap(frame)
        emit(record)
        del reads[:], writes[:]
        state['line'] = None
        state['frame'] = None

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != SOLUTION:
            return None
        if event == 'call' and state['skip'] and isinstance(frame.f_locals.get('self'), state['skip']):
            return None
        if event == 'line':
            flush()
            state['count'] += 1
            state['line'] = frame.f_lineno - 1
            state['frame'] = frame
            if state['count'] > max_steps:
                raise StepLimit()
        return tracer

    def solution_line(tb):
        line = None
        for entry in traceback.extract_tb(tb):
            if entry.filename == SOLUTION:
                line = entry.lineno - 1
        return line

    try:
        namespace = {'__name__': '__solution__'}
        exec(compile(source, SOLUTION, 'exec'), namespace)
    except SyntaxError as e:
        line = e.lineno - 1 if e.lineno and e.filename == SOLUTION else None
        emit({'t': 'error', 'kind': 'compile', 'line': line,
              'message': '%s: %s' % (type(e).__name__, e.msg)})
        return
    except Exception as e:
        emit({'t': 'error', 'kind': 'runtime', 'line': solution_line(e.__traceback__),
              'message': '%s: %s' % (type(e).__name__, e)})
        return

    if is_list:
        # Dựng danh sách ban đầu (chưa theo dõi) rồi lấy phương thức cần chạy của một SLL mới.
        node_class, list_class = namespace.get('Node'), namespace.get('SLL')
        if not callable(node_class) or not callable(list_class):
            emit({'t': 'error', 'kind': 'signature', 'line': None, 'message': ''})
            return
        try:
            sll = list_class()
            head = None
            for value in reversed(config['array']):
                node = node_class(value)
                node.next = head
                head = node
            sll.head = head
        except Exception as e:
            emit({'t': 'error', 'kind': 'runtime', 'line': solution_line(e.__traceback__),
                  'message': '%s: %s' % (type(e).__name__, e)})
            return
        entry = next((getattr(sll, n) for n in config['entry'] if callable(getattr(sll, n, None))), None)
        state['skip'] = node_class
    else:
        entry = next((namespace[n] for n in config['entry'] if callable(namespace.get(n))), None)
    if entry is None:
        emit({'t': 'error', 'kind': 'signature', 'line': None, 'message': ''})
        return

    try:
        sys.settrace(tracer)
        try:
            if is_list:
                result = entry(*config['args'])
            elif config['kind'] == 'sortRange':
                result = entry(arr, 0, len(arr) - 1)
            elif config['kind'] == 'search':
                result = entry(arr, config['target'])
            else:
                result = entry(arr)
        finally:
            sys.settrace(None)
    except StepLimit:
        emit({'t': 'error', 'kind': 'limit', 'line': state['line'], 'message': ''})
        return
    except Exception as e:
        flush()
        emit({'t': 'error', 'kind': 'runtime', 'line': solution_line(e.__traceback__),
              'message': '%s: %s' % (type(e).__name__, e)})
        return

    flush()
    if is_list:
        # Kết quả là danh sách bắt đầu từ head của SLL sau khi phương thức chạy xong.
        head = getattr(sll, 'head', None)
        emit({'t': 'done', 'final': [describe(node.val) for node in walk(head)], 'result': None,
              'resultNode': id(head) if is_node(head) else None})
        return
    is_index = isinstance(result, int) and not isinstance(result, bool)
    emit({'t': 'done', 'final': snapshot(), 'result': result if is_index else None})


main()
