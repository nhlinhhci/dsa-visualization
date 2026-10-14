// Project Singly Linked List: các file sinh viên thấy trong IDE, dùng chung cho giao diện và server.
//   Python: main.py — class Node (chỉ đọc), class SLL (sinh viên viết), main() (chỉ đọc).
//   C++:    SLL.cpp (sinh viên viết), SLL.h, Node.h, Node.cpp, main.cpp (chỉ đọc).
//   Java:   SLL.java (sinh viên viết), Node.java, Main.java (chỉ đọc).
// Mỗi thao tác (Insert at Head...) là một phương thức của class SLL, thay đổi `head` tại chỗ.
// Cả 9 thao tác dùng chung một file SLL: chọn thao tác nào thì IDE mở file SLL và nhảy tới phương thức đó.
import { codeTemplates } from '../codeTemplates.js'

// Thứ tự phương thức trong file. `params`: tham số sau head, lấy từ ô nhập vị trí (`pos`) / giá trị (`val`).
export const SLL_OPERATIONS = [
  { id: 'insertAtHead', python: 'insert_at_head', method: 'insertAtHead', params: ['val'] },
  { id: 'insertAtTail', python: 'insert_at_tail', method: 'insertAtTail', params: ['val'] },
  { id: 'insertAtPosition', python: 'insert_at_position', method: 'insertAtPosition', params: ['pos', 'val'] },
  { id: 'deleteAtHead', python: 'delete_at_head', method: 'deleteAtHead', params: [] },
  { id: 'deleteAtTail', python: 'delete_at_tail', method: 'deleteAtTail', params: [] },
  { id: 'deleteAtPosition', python: 'delete_at_position', method: 'deleteAtPosition', params: ['pos'] },
  { id: 'deleteValue', python: 'delete_by_value', method: 'deleteByValue', params: ['val'] },
  { id: 'reverseList', python: 'reverse', method: 'reverse', params: [] },
  { id: 'traverse', python: 'traverse', method: 'traverse', params: [] },
]

export const findSllOperation = (id) => SLL_OPERATIONS.find((operation) => operation.id === id)

// File sinh viên viết code.
export const SLL_WORK_FILE = { python: 'main.py', cpp: 'SLL.cpp', java: 'SLL.java' }

const STARTER_COMMENT = 'Viết code của bạn ở đây'

const cppParams = (operation) => operation.params.map((name) => `int ${name}`).join(', ')
const pythonParams = (operation) => ['self', ...operation.params].join(', ')

// Chữ ký phương thức để hiện trong IDE / thông báo.
export function sllSignature(operation, language) {
  if (language === 'python') return `def ${operation.python}(${pythonParams(operation)})`
  if (language === 'cpp') return `void SLL::${operation.method}(${cppParams(operation)})`
  return `public void ${operation.method}(${cppParams(operation)})`
}

// --- Các file cố định (chỉ đọc) ---

const PYTHON_NODE = `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


`

const NODE_H = `#ifndef NODE_H
#define NODE_H

class Node {
public:
    int val;
    Node* next;

    Node(int val);
};

#endif
`

const NODE_CPP = `#include "Node.h"

Node::Node(int val) : val(val), next(nullptr) {}
`

const SLL_H = `#ifndef SLL_H
#define SLL_H

#include "Node.h"

class SLL {
public:
    Node* head;

    SLL();

${SLL_OPERATIONS.map((operation) => `    void ${operation.method}(${cppParams(operation)});`).join('\n')}
};

#endif
`

const NODE_JAVA = `public class Node {
    int val;
    Node next;

    public Node(int val) {
        this.val = val;
        this.next = null;
    }
}
`

// File cố định server ghi ra khi biên dịch (ngoài file sinh viên viết và main do server tự sinh).
export const SLL_PROVIDED_FILES = {
  cpp: { 'Node.h': NODE_H, 'Node.cpp': NODE_CPP, 'SLL.h': SLL_H },
  java: { 'Node.java': NODE_JAVA },
}

// --- File sinh viên viết (SLL) ---

// Ghép các phương thức thành file SLL. `methodText(operation)` trả về code của phương thức.
// Trả về { text, methodLines: { id: dòng khai báo phương thức trong text } }.
function assembleSll(language, methodText) {
  const header = {
    python: ['class SLL:', '    def __init__(self):', '        self.head = None', ''],
    cpp: ['#include <iostream>', '#include "SLL.h"', '', 'SLL::SLL() : head(nullptr) {}', ''],
    java: ['public class SLL {', '    Node head;', '', '    public SLL() {', '        head = null;', '    }', ''],
  }[language]
  const lines = [...header]
  const methodLines = {}
  SLL_OPERATIONS.forEach((operation, index) => {
    if (index > 0) lines.push('')
    methodLines[operation.id] = lines.length
    lines.push(...methodText(operation).split('\n'))
  })
  if (language === 'java') lines.push('}')
  return { text: lines.join('\n') + '\n', methodLines }
}

// Phương thức chưa viết: đúng chữ ký, thân để trống (Python cần `pass` để file vẫn chạy được).
function stubMethod(operation, language) {
  const signature = sllSignature(operation, language)
  if (language === 'python') return `    ${signature}:\n        # ${STARTER_COMMENT}\n        pass`
  if (language === 'cpp') return `${signature} {\n    // ${STARTER_COMMENT}\n}`
  return `    ${signature} {\n        // ${STARTER_COMMENT}\n    }`
}

// File SLL ban đầu của sinh viên (Python: chỉ phần class SLL).
export function getSllStarter() {
  return Object.fromEntries(
    ['python', 'cpp', 'java'].map((language) => [
      language,
      assembleSll(language, (operation) => stubMethod(operation, language)).text,
    ]),
  )
}

// File SLL đáp án, ghép từ code đáp án của từng thao tác trong codeTemplates.
export function getSllAnswer(language) {
  return assembleSll(language, (operation) => codeTemplates[operation.id][language].join('\n'))
}

// Dòng khai báo phương thức của thao tác trong file SLL (sinh viên có thể đã sửa file), hoặc null.
export function findMethodLine(language, text, operationId) {
  const operation = findSllOperation(operationId)
  const pattern = {
    python: new RegExp(`^\\s*def\\s+${operation.python}\\s*\\(`),
    cpp: new RegExp(`\\bSLL\\s*::\\s*${operation.method}\\s*\\(`),
    java: new RegExp(`\\bvoid\\s+${operation.method}\\s*\\(`),
  }[language]
  const index = text.split('\n').findIndex((line) => pattern.test(line))
  return index === -1 ? null : index
}

// --- main: dựng danh sách ban đầu rồi gọi thao tác đang chọn (đúng như server chạy) ---

function callArgs(operation, input) {
  return operation.params.map((name) => (name === 'pos' ? input.position : input.target)).join(', ')
}

function describeList(values) {
  return values.length ? values.join(' -> ') : 'rỗng'
}

function buildMain(language, operationId, input) {
  const operation = findSllOperation(operationId)
  const values = input.array
  const args = callArgs(operation, input)
  if (language === 'python') {
    return `

def main():
    sll = SLL()

    # Danh sách ban đầu: ${describeList(values)}
    tail = None
    for value in [${values.join(', ')}]:
        node = Node(value)
        if tail is None:
            sll.head = node
        else:
            tail.next = node
        tail = node

    sll.${operation.python}(${args})


if __name__ == "__main__":
    main()
`
  }
  const build =
    language === 'cpp'
      ? `    // Danh sách ban đầu: ${describeList(values)}
    int values[] = {${values.join(', ')}};
    Node* tail = nullptr;
    for (int value : values) {
        Node* node = new Node(value);
        if (tail == nullptr) {
            list.head = node;
        } else {
            tail->next = node;
        }
        tail = node;
    }`
      : `        // Danh sách ban đầu: ${describeList(values)}
        int[] values = {${values.join(', ')}};
        Node tail = null;
        for (int value : values) {
            Node node = new Node(value);
            if (tail == null) {
                list.head = node;
            } else {
                tail.next = node;
            }
            tail = node;
        }`
  if (language === 'cpp') {
    // Mảng rỗng `{}` không hợp lệ trong C++, nên danh sách rỗng thì bỏ qua phần dựng danh sách.
    const body = values.length ? build : '    // Danh sách ban đầu: rỗng'
    return `#include <iostream>
#include "SLL.h"

int main() {
    SLL list;

${body}

    list.${operation.method}(${args});
    return 0;
}
`
  }
  return `public class Main {
    public static void main(String[] args) {
        SLL list = new SLL();

${build}

        list.${operation.method}(${args});
    }
}
`
}

// --- Project hiển thị trong IDE ---

// `sllText`: file SLL (Python: phần class SLL) — của sinh viên, hoặc đáp án nếu `showResult`.
// Trả về:
//   files: [{ name, content, editable }] theo thứ tự tab, file sinh viên viết đứng đầu;
//   workFile: tên file sinh viên viết; runCode: nội dung gửi lên server;
//   protectedRange: { prefix, suffix } số ký tự đầu/cuối của work file không được sửa (Python);
//   lineOffset: số dòng đứng trước phần SLL trong work file;
//   extractSll(text): lấy lại phần SLL từ nội dung work file sau khi sinh viên sửa.
export function buildSllProject({ language, sllText, operationId, input, editable }) {
  const main = buildMain(language, operationId, input)
  if (language === 'python') {
    const content = PYTHON_NODE + sllText + main
    return {
      workFile: 'main.py',
      files: [{ name: 'main.py', content, editable }],
      runCode: content,
      protectedRange: { prefix: PYTHON_NODE.length, suffix: main.length },
      lineOffset: PYTHON_NODE.split('\n').length - 1,
      extractSll: (text) => text.slice(PYTHON_NODE.length, text.length - main.length),
    }
  }
  const provided = SLL_PROVIDED_FILES[language]
  const files =
    language === 'cpp'
      ? [
          { name: 'SLL.cpp', content: sllText, editable },
          { name: 'SLL.h', content: provided['SLL.h'] },
          { name: 'Node.h', content: provided['Node.h'] },
          { name: 'Node.cpp', content: provided['Node.cpp'] },
          { name: 'main.cpp', content: main },
        ]
      : [
          { name: 'SLL.java', content: sllText, editable },
          { name: 'Node.java', content: provided['Node.java'] },
          { name: 'Main.java', content: main },
        ]
  return {
    workFile: files[0].name,
    files,
    runCode: sllText,
    protectedRange: null,
    lineOffset: 0,
    extractSll: (text) => text,
  }
}
