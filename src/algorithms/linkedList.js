import { codeLines } from '../data/codeTemplates.js'
import { findSllOperation } from '../data/projects/singlyLinkedList.js'

const MAX_NODES = 60

// Danh sách node có thể đi tới từ các biến đang trỏ vào node: [{ id, val, next }].
// Cùng định dạng với `heap` mà server gửi về khi chạy code của sinh viên.
export function snapshotHeap(roots) {
  const heap = []
  const seen = new Set()
  for (const root of roots) {
    let node = root
    while (node && !seen.has(node.id) && heap.length < MAX_NODES) {
      seen.add(node.id)
      heap.push({ id: node.id, val: node.val, next: node.next?.id ?? null })
      node = node.next
    }
  }
  return heap
}

const isNode = (value) => value !== null && typeof value === 'object' && 'next' in value

// Tên biến head như sinh viên thấy trong code: field của SLL (`self.head` ở Python).
export const headName = (language) => (language === 'python' ? 'self.head' : 'head')

// Gom step cho một phương thức của class SLL. Biến nằm trong object `v` (sửa trực tiếp khi biến đổi
// giá trị; `undefined` = chưa khai báo), gồm cả field head; biến trỏ tới node giữ chính object node.
// Mỗi step chụp lại biến và toàn bộ node đang đi tới được từ các biến đó.
function createListRecorder(values, operationId, language) {
  const steps = []
  let nextId = 1
  const operation = findSllOperation(operationId)
  const LINE = codeLines[operationId][language]
  const HEAD = headName(language)

  const createNode = (val) => ({ id: `n${nextId++}`, val, next: null })

  // Danh sách ban đầu được tạo trước, nên các node của nó có id n1, n2... theo thứ tự.
  let head = null
  let tail = null
  for (const value of values) {
    const node = createNode(value)
    if (tail) tail.next = node
    else head = node
    tail = node
  }
  const v = { [HEAD]: head }

  const push = (line, extra = {}) => {
    const entries = Object.entries(v).filter(([, value]) => value !== undefined)
    steps.push({
      array: [],
      comparing: [],
      swapping: false,
      sorted: [],
      lineHighlighted: LINE[line],
      scope: language === 'python' ? operation.python : operation.method,
      vars: Object.fromEntries(
        entries.map(([name, value]) => [name, isNode(value) ? { node: value.id, val: value.val } : value]),
      ),
      heap: snapshotHeap(entries.map(([, value]) => value).filter(isNode)),
      ...extra,
    })
  }

  // Bước kết thúc: danh sách sau khi phương thức chạy xong.
  const finish = (extra = {}) => {
    steps.push({
      array: [],
      comparing: [],
      swapping: false,
      sorted: [],
      lineHighlighted: null,
      heap: snapshotHeap([v[HEAD]].filter(Boolean)),
      resultNode: v[HEAD]?.id ?? null,
      resultLabel: HEAD,
      correct: true,
      ...extra,
    })
    return steps
  }

  const name = (snake, camel) => (language === 'python' ? snake : camel)
  return { v, HEAD, name, createNode, push, finish }
}

export const linkedListComplexity = {
  insertAtHead: { time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' }, space: 'O(1)' },
  insertAtTail: { time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' }, space: 'O(1)' },
  deleteValue: { time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' }, space: 'O(1)' },
  reverseList: { time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' }, space: 'O(1)' },
  insertAtPosition: { time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' }, space: 'O(1)' },
  deleteAtHead: { time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' }, space: 'O(1)' },
  deleteAtTail: { time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' }, space: 'O(1)' },
  deleteAtPosition: { time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' }, space: 'O(1)' },
  traverse: { time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' }, space: 'O(1)' },
}

// Số dòng trong step là số dòng tính từ dòng khai báo phương thức; giao diện cộng thêm vị trí của
// phương thức trong file SLL. `active`: node đang được xét ở step đó (tô vàng).

export function generateInsertAtHeadSteps(values, { language = 'python', target } = {}) {
  const list = createListRecorder(values, 'insertAtHead', language)
  const { v, HEAD } = list
  const NEW = list.name('new_node', 'newNode')
  Object.assign(v, { val: target, [NEW]: undefined })

  list.push('FUNCTION')
  v[NEW] = list.createNode(target)
  list.push('CREATE', { active: [v[NEW].id] })
  v[NEW].next = v[HEAD]
  list.push('LINK')
  v[HEAD] = v[NEW]
  list.push('MOVE_HEAD')
  return list.finish()
}

export function generateInsertAtTailSteps(values, { language = 'python', target } = {}) {
  const list = createListRecorder(values, 'insertAtTail', language)
  const { v, HEAD } = list
  const NEW = list.name('new_node', 'newNode')
  Object.assign(v, { val: target, [NEW]: undefined, curr: undefined })

  list.push('FUNCTION')
  v[NEW] = list.createNode(target)
  list.push('CREATE', { active: [v[NEW].id] })
  list.push('CHECK_EMPTY')
  if (v[HEAD] === null) {
    v[HEAD] = v[NEW]
    list.push('SET_HEAD')
    list.push('RETURN_EARLY')
    return list.finish()
  }
  v.curr = v[HEAD]
  list.push('INIT_CURR', { active: [v.curr.id] })
  while (true) {
    list.push('WHILE', { active: [v.curr.id] })
    if (v.curr.next === null) break
    v.curr = v.curr.next
    list.push('ADVANCE', { active: [v.curr.id] })
  }
  v.curr.next = v[NEW]
  list.push('LINK')
  return list.finish()
}

export function generateInsertAtPositionSteps(values, { language = 'python', target, position } = {}) {
  const list = createListRecorder(values, 'insertAtPosition', language)
  const { v, HEAD } = list
  const NEW = list.name('new_node', 'newNode')
  Object.assign(v, { pos: position, val: target, [NEW]: undefined, curr: undefined, index: undefined })

  list.push('FUNCTION')
  list.push('CHECK_FRONT')
  if (position === 0) {
    v[NEW] = list.createNode(target)
    list.push('CREATE_FRONT', { active: [v[NEW].id] })
    v[NEW].next = v[HEAD]
    list.push('LINK_FRONT')
    v[HEAD] = v[NEW]
    list.push('MOVE_HEAD')
    list.push('RETURN_FRONT')
    return list.finish()
  }
  v.curr = v[HEAD]
  list.push('INIT_CURR', { active: v.curr ? [v.curr.id] : [] })
  v.index = 0
  list.push('INIT_INDEX')
  while (true) {
    list.push('WHILE', { active: v.curr ? [v.curr.id] : [] })
    if (!(v.curr !== null && v.index < position - 1)) break
    v.curr = v.curr.next
    list.push('ADVANCE', { active: v.curr ? [v.curr.id] : [] })
    v.index++
    list.push('INCREMENT')
  }
  list.push('CHECK_NULL')
  if (v.curr === null) {
    list.push('RETURN_UNCHANGED')
    return list.finish()
  }
  v[NEW] = list.createNode(target)
  list.push('CREATE', { active: [v[NEW].id] })
  v[NEW].next = v.curr.next
  list.push('LINK')
  v.curr.next = v[NEW]
  list.push('ATTACH')
  return list.finish()
}

export function generateDeleteAtHeadSteps(values, { language = 'python' } = {}) {
  const list = createListRecorder(values, 'deleteAtHead', language)
  const { v, HEAD } = list
  const OLD = list.name('old_head', 'oldHead')
  v[OLD] = undefined

  list.push('FUNCTION')
  list.push('CHECK_EMPTY')
  if (v[HEAD] === null) {
    list.push('RETURN_EMPTY')
    return list.finish()
  }
  v[OLD] = v[HEAD]
  list.push('SAVE_OLD', { active: [v[OLD].id] })
  v[HEAD] = v[HEAD].next
  list.push('MOVE_HEAD')
  v[OLD].next = null
  list.push('DETACH', { active: [v[OLD].id] })
  return list.finish()
}

export function generateDeleteAtTailSteps(values, { language = 'python' } = {}) {
  const list = createListRecorder(values, 'deleteAtTail', language)
  const { v, HEAD } = list
  v.curr = undefined

  list.push('FUNCTION')
  list.push('CHECK_EMPTY')
  if (v[HEAD] === null) {
    list.push('RETURN_EMPTY')
    return list.finish()
  }
  list.push('CHECK_SINGLE', { active: [v[HEAD].id] })
  if (v[HEAD].next === null) {
    v[HEAD] = null
    list.push('CLEAR')
    list.push('RETURN_SINGLE')
    return list.finish()
  }
  v.curr = v[HEAD]
  list.push('INIT_CURR', { active: [v.curr.id] })
  while (true) {
    list.push('WHILE', { active: [v.curr.id] })
    if (v.curr.next.next === null) break
    v.curr = v.curr.next
    list.push('ADVANCE', { active: [v.curr.id] })
  }
  v.curr.next = null
  list.push('DETACH')
  return list.finish()
}

export function generateDeleteAtPositionSteps(values, { language = 'python', position } = {}) {
  const list = createListRecorder(values, 'deleteAtPosition', language)
  const { v, HEAD } = list
  Object.assign(v, { pos: position, curr: undefined, index: undefined })

  list.push('FUNCTION')
  list.push('CHECK_EMPTY')
  if (v[HEAD] === null) {
    list.push('RETURN_EMPTY')
    return list.finish()
  }
  list.push('CHECK_FRONT')
  if (position === 0) {
    v[HEAD] = v[HEAD].next
    list.push('MOVE_HEAD')
    list.push('RETURN_FRONT')
    return list.finish()
  }
  v.curr = v[HEAD]
  list.push('INIT_CURR', { active: [v.curr.id] })
  v.index = 0
  list.push('INIT_INDEX')
  while (true) {
    list.push('WHILE', { active: [v.curr.id] })
    if (!(v.curr.next !== null && v.index < position - 1)) break
    v.curr = v.curr.next
    list.push('ADVANCE', { active: [v.curr.id] })
    v.index++
    list.push('INCREMENT')
  }
  list.push('CHECK_NULL')
  if (v.curr.next === null) {
    list.push('RETURN_UNCHANGED')
    return list.finish()
  }
  v.curr.next = v.curr.next.next
  list.push('UNLINK')
  return list.finish()
}

export function generateDeleteValueSteps(values, { language = 'python', target } = {}) {
  const list = createListRecorder(values, 'deleteValue', language)
  const { v, HEAD } = list
  Object.assign(v, { val: target, prev: undefined, curr: undefined })

  list.push('FUNCTION')
  list.push('CHECK_EMPTY')
  if (v[HEAD] === null) {
    list.push('RETURN_EMPTY')
    return list.finish()
  }
  list.push('CHECK_HEAD', { active: [v[HEAD].id] })
  if (v[HEAD].val === target) {
    v[HEAD] = v[HEAD].next
    list.push('MOVE_HEAD')
    list.push('RETURN_HEAD')
    return list.finish()
  }
  v.prev = v[HEAD]
  list.push('INIT_PREV')
  v.curr = v[HEAD].next
  list.push('INIT_CURR')
  while (true) {
    list.push('WHILE')
    if (v.curr === null) break
    list.push('COMPARE', { active: [v.curr.id] })
    if (v.curr.val === target) {
      v.prev.next = v.curr.next
      list.push('UNLINK')
      list.push('RETURN_FOUND')
      return list.finish()
    }
    v.prev = v.curr
    list.push('ADVANCE_PREV')
    v.curr = v.curr.next
    list.push('ADVANCE_CURR')
  }
  return list.finish()
}

export function generateReverseListSteps(values, { language = 'python' } = {}) {
  const list = createListRecorder(values, 'reverseList', language)
  const { v, HEAD } = list
  const NEXT = list.name('next_node', 'nextNode')
  Object.assign(v, { prev: undefined, curr: undefined, [NEXT]: undefined })

  list.push('FUNCTION')
  v.prev = null
  list.push('INIT_PREV')
  v.curr = v[HEAD]
  list.push('INIT_CURR')
  while (true) {
    list.push('WHILE')
    if (v.curr === null) break
    v[NEXT] = v.curr.next
    list.push('SAVE_NEXT')
    v.curr.next = v.prev
    list.push('REVERSE_LINK')
    v.prev = v.curr
    list.push('ADVANCE_PREV')
    v.curr = v[NEXT]
    list.push('ADVANCE_CURR')
  }
  v[HEAD] = v.prev
  list.push('SET_HEAD')
  return list.finish()
}

// `printed`: các giá trị đã in ra tới step đó.
export function generateTraverseSteps(values, { language = 'python' } = {}) {
  const list = createListRecorder(values, 'traverse', language)
  const { v, HEAD } = list
  const printed = []
  v.curr = undefined

  list.push('FUNCTION', { printed: [] })
  v.curr = v[HEAD]
  list.push('INIT_CURR', { active: v.curr ? [v.curr.id] : [], printed: [] })
  while (true) {
    list.push('WHILE', { active: v.curr ? [v.curr.id] : [], printed: [...printed] })
    if (v.curr === null) break
    printed.push(v.curr.val)
    list.push('VISIT', { active: [v.curr.id], printed: [...printed] })
    v.curr = v.curr.next
    list.push('ADVANCE', { active: v.curr ? [v.curr.id] : [], printed: [...printed] })
  }
  return list.finish({ printed })
}

// Kết quả đúng của từng thao tác, để chấm code của sinh viên: mảng giá trị của danh sách sau khi
// phương thức chạy (với Traversal: các giá trị phải được in ra, theo thứ tự).
export const expectedList = {
  insertAtHead: (values, target) => [target, ...values],
  insertAtTail: (values, target) => [...values, target],
  deleteValue: (values, target) => {
    const index = values.indexOf(target)
    return index === -1 ? values : values.filter((_, i) => i !== index)
  },
  reverseList: (values) => [...values].reverse(),
  insertAtPosition: (values, target, position) =>
    position >= 0 && position <= values.length
      ? [...values.slice(0, position), target, ...values.slice(position)]
      : values,
  deleteAtHead: (values) => values.slice(1),
  deleteAtTail: (values) => values.slice(0, -1),
  deleteAtPosition: (values, target, position) =>
    position >= 0 && position < values.length ? values.filter((_, i) => i !== position) : values,
  traverse: (values) => values,
}
