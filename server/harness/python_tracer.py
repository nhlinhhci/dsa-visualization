"""Chạy hàm của sinh viên (vd. bubble_sort(arr)) và ghi lại từng dòng được thực thi.

Cách gọi: python python_tracer.py <code_path> <trace_path> <max_steps> <config_json>
config: {"array": [...], "entry": [tên hàm...], "kind": "sort" | "sortRange" | "search", "target": số}
Mỗi dòng của trace_path là một bản ghi JSON: step / error / done.
"""
import json
import sys
import traceback

SOLUTION = '<solution>'


class StepLimit(BaseException):
    pass


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

    arr = TrackedList(config['array'])

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
            result[name] = describe(value)
        return result

    state = {'line': None, 'count': 0, 'frame': None}

    def flush():
        if state['line'] is None:
            return
        # Biến lấy SAU khi dòng chạy xong, cùng thời điểm với trạng thái mảng.
        frame = state['frame']
        emit({'t': 'step', 'line': state['line'], 'array': snapshot(),
              'reads': reads[:], 'writes': writes[:],
              'scope': frame.f_code.co_name, 'vars': variables(frame)})
        del reads[:], writes[:]
        state['line'] = None
        state['frame'] = None

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != SOLUTION:
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

    entry = next((namespace[n] for n in config['entry'] if callable(namespace.get(n))), None)
    if entry is None:
        emit({'t': 'error', 'kind': 'signature', 'line': None, 'message': ''})
        return

    try:
        sys.settrace(tracer)
        try:
            if config['kind'] == 'sortRange':
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
    is_index = isinstance(result, int) and not isinstance(result, bool)
    emit({'t': 'done', 'final': snapshot(), 'result': result if is_index else None})


main()
