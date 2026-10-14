import { algorithmSpecs } from '../data/algorithmSpecs.js'
import { binarySearchComplexity, generateBinarySearchSteps } from './binarySearch.js'
import { bubbleSortComplexity, generateBubbleSortSteps } from './bubbleSort.js'
import { generateInsertionSortSteps, insertionSortComplexity } from './insertionSort.js'
import { generateLinearSearchSteps, linearSearchComplexity } from './linearSearch.js'
import {
  expectedList,
  generateDeleteAtHeadSteps,
  generateDeleteAtPositionSteps,
  generateDeleteAtTailSteps,
  generateDeleteValueSteps,
  generateInsertAtHeadSteps,
  generateInsertAtPositionSteps,
  generateInsertAtTailSteps,
  generateReverseListSteps,
  generateTraverseSteps,
  linkedListComplexity,
} from './linkedList.js'
import { generateMergeSortSteps, mergeSortComplexity } from './mergeSort.js'
import { generateQuickSortSteps, quickSortComplexity } from './quickSort.js'
import { generateSelectionSortSteps, selectionSortComplexity } from './selectionSort.js'

// Danh sách thuật toán hiển thị trên menu. `generateSteps(array, { language, optimized, target })`
// sinh step cho code đáp án; `optimizedComplexity` chỉ có ở thuật toán có bản tối ưu.
// Thuật toán trên cấu trúc dữ liệu có thêm `group` (tiêu đề nhóm trong menu), `expected(values, target)`
// (kết quả đúng để chấm), `targetLabel` (tên ô nhập giá trị) và `positionLabel` (tên ô nhập vị trí);
// không có nhãn thì thao tác không cần giá trị / vị trí đó.
const definitions = [
  {
    id: 'bubbleSort',
    name: 'Bubble Sort',
    category: 'sort',
    generateSteps: generateBubbleSortSteps,
    complexity: bubbleSortComplexity.basic,
    optimizedComplexity: bubbleSortComplexity.optimized,
    optimizedLabel: 'Tối ưu (cờ swapped)',
  },
  {
    id: 'selectionSort',
    name: 'Selection Sort',
    category: 'sort',
    generateSteps: generateSelectionSortSteps,
    complexity: selectionSortComplexity,
  },
  {
    id: 'insertionSort',
    name: 'Insertion Sort',
    category: 'sort',
    generateSteps: generateInsertionSortSteps,
    complexity: insertionSortComplexity,
  },
  {
    id: 'mergeSort',
    name: 'Merge Sort',
    category: 'sort',
    generateSteps: generateMergeSortSteps,
    complexity: mergeSortComplexity,
  },
  {
    id: 'quickSort',
    name: 'Quick Sort',
    category: 'sort',
    generateSteps: generateQuickSortSteps,
    complexity: quickSortComplexity,
  },
  {
    id: 'linearSearch',
    name: 'Linear Search',
    category: 'search',
    generateSteps: generateLinearSearchSteps,
    complexity: linearSearchComplexity,
  },
  {
    id: 'binarySearch',
    name: 'Binary Search',
    category: 'search',
    // Binary Search chỉ đúng trên mảng đã sắp xếp.
    requiresSortedInput: true,
    generateSteps: generateBinarySearchSteps,
    complexity: binarySearchComplexity,
  },
  {
    id: 'insertAtHead',
    name: 'Insert at Head',
    category: 'dataStructure',
    group: 'Singly Linked List',
    targetLabel: 'Giá trị chèn',
    generateSteps: generateInsertAtHeadSteps,
    expected: expectedList.insertAtHead,
    complexity: linkedListComplexity.insertAtHead,
  },
  {
    id: 'insertAtTail',
    name: 'Insert at Tail',
    category: 'dataStructure',
    group: 'Singly Linked List',
    targetLabel: 'Giá trị chèn',
    generateSteps: generateInsertAtTailSteps,
    expected: expectedList.insertAtTail,
    complexity: linkedListComplexity.insertAtTail,
  },
  {
    id: 'insertAtPosition',
    name: 'Insert at Position',
    category: 'dataStructure',
    group: 'Singly Linked List',
    targetLabel: 'Giá trị chèn',
    positionLabel: 'Vị trí',
    generateSteps: generateInsertAtPositionSteps,
    expected: expectedList.insertAtPosition,
    complexity: linkedListComplexity.insertAtPosition,
  },
  {
    id: 'deleteAtHead',
    name: 'Delete at Head',
    category: 'dataStructure',
    group: 'Singly Linked List',
    generateSteps: generateDeleteAtHeadSteps,
    expected: expectedList.deleteAtHead,
    complexity: linkedListComplexity.deleteAtHead,
  },
  {
    id: 'deleteAtTail',
    name: 'Delete at Tail',
    category: 'dataStructure',
    group: 'Singly Linked List',
    generateSteps: generateDeleteAtTailSteps,
    expected: expectedList.deleteAtTail,
    complexity: linkedListComplexity.deleteAtTail,
  },
  {
    id: 'deleteAtPosition',
    name: 'Delete at Position',
    category: 'dataStructure',
    group: 'Singly Linked List',
    positionLabel: 'Vị trí',
    generateSteps: generateDeleteAtPositionSteps,
    expected: expectedList.deleteAtPosition,
    complexity: linkedListComplexity.deleteAtPosition,
  },
  {
    id: 'deleteValue',
    name: 'Delete by Value',
    category: 'dataStructure',
    group: 'Singly Linked List',
    targetLabel: 'Giá trị xóa',
    generateSteps: generateDeleteValueSteps,
    expected: expectedList.deleteValue,
    complexity: linkedListComplexity.deleteValue,
  },
  {
    id: 'reverseList',
    name: 'Reverse',
    category: 'dataStructure',
    group: 'Singly Linked List',
    generateSteps: generateReverseListSteps,
    expected: expectedList.reverseList,
    complexity: linkedListComplexity.reverseList,
  },
  {
    id: 'traverse',
    name: 'Traversal',
    category: 'dataStructure',
    group: 'Singly Linked List',
    generateSteps: generateTraverseSteps,
    expected: expectedList.traverse,
    complexity: linkedListComplexity.traverse,
  },
]

export const algorithms = definitions.map((definition) => ({
  ...definition,
  // Tên hiển thị ở tiêu đề trang, kèm tên nhóm nếu có (vd. "Singly Linked List · Insert at Head").
  title: definition.group ? `${definition.group} · ${definition.name}` : definition.name,
  signatures: algorithmSpecs[definition.id].signatures,
}))

export const algorithmCategories = [
  { id: 'sort', label: 'Sort Algorithms' },
  { id: 'search', label: 'Search Algorithms' },
  { id: 'dataStructure', label: 'Data Structures' },
]
