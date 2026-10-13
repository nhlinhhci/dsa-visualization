import { algorithmSpecs } from '../data/algorithmSpecs.js'
import { binarySearchComplexity, generateBinarySearchSteps } from './binarySearch.js'
import { bubbleSortComplexity, generateBubbleSortSteps } from './bubbleSort.js'
import { generateInsertionSortSteps, insertionSortComplexity } from './insertionSort.js'
import { generateLinearSearchSteps, linearSearchComplexity } from './linearSearch.js'
import { generateMergeSortSteps, mergeSortComplexity } from './mergeSort.js'
import { generateQuickSortSteps, quickSortComplexity } from './quickSort.js'
import { generateSelectionSortSteps, selectionSortComplexity } from './selectionSort.js'

// Danh sách thuật toán hiển thị trên menu. `generateSteps(array, { language, optimized, target })`
// sinh step cho code đáp án; `optimizedComplexity` chỉ có ở thuật toán có bản tối ưu.
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
]

export const algorithms = definitions.map((definition) => ({
  ...definition,
  signatures: algorithmSpecs[definition.id].signatures,
}))

export const algorithmCategories = [
  { id: 'sort', label: 'Sort Algorithms' },
  { id: 'search', label: 'Search Algorithms' },
]
