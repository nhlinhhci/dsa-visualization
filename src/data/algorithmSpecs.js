// Hàm mà sinh viên phải viết cho từng thuật toán. Dùng chung cho giao diện và server chạy code.
// `kind` quyết định cách server gọi hàm:
//   sort      -> f(arr)
//   sortRange -> f(arr, 0, n - 1)
//   search    -> f(arr, target), trả về index hoặc -1
export const algorithmSpecs = {
  bubbleSort: {
    kind: 'sort',
    entry: { python: 'bubble_sort', cpp: 'bubbleSort', java: 'bubbleSort' },
    signatures: {
      python: 'def bubble_sort(arr):',
      cpp: 'void bubbleSort(vector<int>& arr)',
      java: 'void bubbleSort(int[] arr)',
    },
  },
  selectionSort: {
    kind: 'sort',
    entry: { python: 'selection_sort', cpp: 'selectionSort', java: 'selectionSort' },
    signatures: {
      python: 'def selection_sort(arr):',
      cpp: 'void selectionSort(vector<int>& arr)',
      java: 'void selectionSort(int[] arr)',
    },
  },
  insertionSort: {
    kind: 'sort',
    entry: { python: 'insertion_sort', cpp: 'insertionSort', java: 'insertionSort' },
    signatures: {
      python: 'def insertion_sort(arr):',
      cpp: 'void insertionSort(vector<int>& arr)',
      java: 'void insertionSort(int[] arr)',
    },
  },
  mergeSort: {
    kind: 'sortRange',
    entry: { python: 'merge_sort', cpp: 'mergeSort', java: 'mergeSort' },
    signatures: {
      python: 'def merge_sort(arr, left, right):',
      cpp: 'void mergeSort(vector<int>& arr, int left, int right)',
      java: 'void mergeSort(int[] arr, int left, int right)',
    },
  },
  quickSort: {
    kind: 'sortRange',
    entry: { python: 'quick_sort', cpp: 'quickSort', java: 'quickSort' },
    signatures: {
      python: 'def quick_sort(arr, low, high):',
      cpp: 'void quickSort(vector<int>& arr, int low, int high)',
      java: 'void quickSort(int[] arr, int low, int high)',
    },
  },
  linearSearch: {
    kind: 'search',
    entry: { python: 'linear_search', cpp: 'linearSearch', java: 'linearSearch' },
    signatures: {
      python: 'def linear_search(arr, target):',
      cpp: 'int linearSearch(vector<int>& arr, int target)',
      java: 'int linearSearch(int[] arr, int target)',
    },
  },
  binarySearch: {
    kind: 'search',
    entry: { python: 'binary_search', cpp: 'binarySearch', java: 'binarySearch' },
    signatures: {
      python: 'def binary_search(arr, target):',
      cpp: 'int binarySearch(vector<int>& arr, int target)',
      java: 'int binarySearch(int[] arr, int target)',
    },
  },
}
