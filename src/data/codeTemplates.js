// Mỗi phần tử là một dòng code; chỉ số mảng chính là số dòng mà `lineHighlighted` trỏ tới.
// Key là id thuật toán; `bubbleSortOptimized` là bản Bubble Sort thêm cờ `swapped` để thoát sớm.
// Số dòng của từng thao tác theo từng ngôn ngữ nằm ở `codeLines` bên dưới.
export const codeTemplates = {
  bubbleSort: {
    python: [
      'def bubble_sort(arr):', // 0
      '    n = len(arr)', // 1
      '    for i in range(n - 1):', // 2
      '        for j in range(n - i - 1):', // 3
      '            if arr[j] > arr[j + 1]:', // 4
      '                arr[j], arr[j + 1] = arr[j + 1], arr[j]', // 5
    ],
    cpp: [
      'void bubbleSort(vector<int>& arr) {', // 0
      '    int n = arr.size();', // 1
      '    for (int i = 0; i < n - 1; i++) {', // 2
      '        for (int j = 0; j < n - i - 1; j++) {', // 3
      '            if (arr[j] > arr[j + 1]) {', // 4
      '                swap(arr[j], arr[j + 1]);', // 5
      '            }', // 6
      '        }', // 7
      '    }', // 8
      '}', // 9
    ],
    java: [
      'void bubbleSort(int[] arr) {', // 0
      '    int n = arr.length;', // 1
      '    for (int i = 0; i < n - 1; i++) {', // 2
      '        for (int j = 0; j < n - i - 1; j++) {', // 3
      '            if (arr[j] > arr[j + 1]) {', // 4
      '                int temp = arr[j];', // 5
      '                arr[j] = arr[j + 1];', // 6
      '                arr[j + 1] = temp;', // 7
      '            }', // 8
      '        }', // 9
      '    }', // 10
      '}', // 11
    ],
  },
  bubbleSortOptimized: {
    python: [
      'def bubble_sort(arr):', // 0
      '    n = len(arr)', // 1
      '    for i in range(n - 1):', // 2
      '        swapped = False', // 3
      '        for j in range(n - i - 1):', // 4
      '            if arr[j] > arr[j + 1]:', // 5
      '                arr[j], arr[j + 1] = arr[j + 1], arr[j]', // 6
      '                swapped = True', // 7
      '        if not swapped:', // 8
      '            break', // 9
    ],
    cpp: [
      'void bubbleSort(vector<int>& arr) {', // 0
      '    int n = arr.size();', // 1
      '    for (int i = 0; i < n - 1; i++) {', // 2
      '        bool swapped = false;', // 3
      '        for (int j = 0; j < n - i - 1; j++) {', // 4
      '            if (arr[j] > arr[j + 1]) {', // 5
      '                swap(arr[j], arr[j + 1]);', // 6
      '                swapped = true;', // 7
      '            }', // 8
      '        }', // 9
      '        if (!swapped) {', // 10
      '            break;', // 11
      '        }', // 12
      '    }', // 13
      '}', // 14
    ],
    java: [
      'void bubbleSort(int[] arr) {', // 0
      '    int n = arr.length;', // 1
      '    for (int i = 0; i < n - 1; i++) {', // 2
      '        boolean swapped = false;', // 3
      '        for (int j = 0; j < n - i - 1; j++) {', // 4
      '            if (arr[j] > arr[j + 1]) {', // 5
      '                int temp = arr[j];', // 6
      '                arr[j] = arr[j + 1];', // 7
      '                arr[j + 1] = temp;', // 8
      '                swapped = true;', // 9
      '            }', // 10
      '        }', // 11
      '        if (!swapped) {', // 12
      '            break;', // 13
      '        }', // 14
      '    }', // 15
      '}', // 16
    ],
  },
  selectionSort: {
    python: [
      'def selection_sort(arr):', // 0
      '    n = len(arr)', // 1
      '    for i in range(n - 1):', // 2
      '        min_idx = i', // 3
      '        for j in range(i + 1, n):', // 4
      '            if arr[j] < arr[min_idx]:', // 5
      '                min_idx = j', // 6
      '        arr[i], arr[min_idx] = arr[min_idx], arr[i]', // 7
    ],
    cpp: [
      'void selectionSort(vector<int>& arr) {', // 0
      '    int n = arr.size();', // 1
      '    for (int i = 0; i < n - 1; i++) {', // 2
      '        int minIdx = i;', // 3
      '        for (int j = i + 1; j < n; j++) {', // 4
      '            if (arr[j] < arr[minIdx]) {', // 5
      '                minIdx = j;', // 6
      '            }', // 7
      '        }', // 8
      '        swap(arr[i], arr[minIdx]);', // 9
      '    }', // 10
      '}', // 11
    ],
    java: [
      'void selectionSort(int[] arr) {', // 0
      '    int n = arr.length;', // 1
      '    for (int i = 0; i < n - 1; i++) {', // 2
      '        int minIdx = i;', // 3
      '        for (int j = i + 1; j < n; j++) {', // 4
      '            if (arr[j] < arr[minIdx]) {', // 5
      '                minIdx = j;', // 6
      '            }', // 7
      '        }', // 8
      '        int temp = arr[i];', // 9
      '        arr[i] = arr[minIdx];', // 10
      '        arr[minIdx] = temp;', // 11
      '    }', // 12
      '}', // 13
    ],
  },
  insertionSort: {
    python: [
      'def insertion_sort(arr):', // 0
      '    for i in range(1, len(arr)):', // 1
      '        key = arr[i]', // 2
      '        j = i - 1', // 3
      '        while j >= 0 and arr[j] > key:', // 4
      '            arr[j + 1] = arr[j]', // 5
      '            j -= 1', // 6
      '        arr[j + 1] = key', // 7
    ],
    cpp: [
      'void insertionSort(vector<int>& arr) {', // 0
      '    for (int i = 1; i < arr.size(); i++) {', // 1
      '        int key = arr[i];', // 2
      '        int j = i - 1;', // 3
      '        while (j >= 0 && arr[j] > key) {', // 4
      '            arr[j + 1] = arr[j];', // 5
      '            j--;', // 6
      '        }', // 7
      '        arr[j + 1] = key;', // 8
      '    }', // 9
      '}', // 10
    ],
    java: [
      'void insertionSort(int[] arr) {', // 0
      '    for (int i = 1; i < arr.length; i++) {', // 1
      '        int key = arr[i];', // 2
      '        int j = i - 1;', // 3
      '        while (j >= 0 && arr[j] > key) {', // 4
      '            arr[j + 1] = arr[j];', // 5
      '            j--;', // 6
      '        }', // 7
      '        arr[j + 1] = key;', // 8
      '    }', // 9
      '}', // 10
    ],
  },
  mergeSort: {
    python: [
      'def merge(arr, left, mid, right):', // 0
      '    temp = []', // 1
      '    i, j = left, mid + 1', // 2
      '    while i <= mid and j <= right:', // 3
      '        if arr[i] <= arr[j]:', // 4
      '            temp.append(arr[i])', // 5
      '            i += 1', // 6
      '        else:', // 7
      '            temp.append(arr[j])', // 8
      '            j += 1', // 9
      '    while i <= mid:', // 10
      '        temp.append(arr[i])', // 11
      '        i += 1', // 12
      '    while j <= right:', // 13
      '        temp.append(arr[j])', // 14
      '        j += 1', // 15
      '    for k in range(len(temp)):', // 16
      '        arr[left + k] = temp[k]', // 17
      '', // 18
      'def merge_sort(arr, left, right):', // 19
      '    if left >= right:', // 20
      '        return', // 21
      '    mid = (left + right) // 2', // 22
      '    merge_sort(arr, left, mid)', // 23
      '    merge_sort(arr, mid + 1, right)', // 24
      '    merge(arr, left, mid, right)', // 25
    ],
    cpp: [
      'void merge(vector<int>& arr, int left, int mid, int right) {', // 0
      '    vector<int> temp;', // 1
      '    int i = left, j = mid + 1;', // 2
      '    while (i <= mid && j <= right) {', // 3
      '        if (arr[i] <= arr[j]) {', // 4
      '            temp.push_back(arr[i]);', // 5
      '            i++;', // 6
      '        } else {', // 7
      '            temp.push_back(arr[j]);', // 8
      '            j++;', // 9
      '        }', // 10
      '    }', // 11
      '    while (i <= mid) {', // 12
      '        temp.push_back(arr[i]);', // 13
      '        i++;', // 14
      '    }', // 15
      '    while (j <= right) {', // 16
      '        temp.push_back(arr[j]);', // 17
      '        j++;', // 18
      '    }', // 19
      '    for (int k = 0; k < temp.size(); k++) {', // 20
      '        arr[left + k] = temp[k];', // 21
      '    }', // 22
      '}', // 23
      '', // 24
      'void mergeSort(vector<int>& arr, int left, int right) {', // 25
      '    if (left >= right) {', // 26
      '        return;', // 27
      '    }', // 28
      '    int mid = (left + right) / 2;', // 29
      '    mergeSort(arr, left, mid);', // 30
      '    mergeSort(arr, mid + 1, right);', // 31
      '    merge(arr, left, mid, right);', // 32
      '}', // 33
    ],
    java: [
      'void merge(int[] arr, int left, int mid, int right) {', // 0
      '    int[] temp = new int[right - left + 1];', // 1
      '    int i = left, j = mid + 1, k = 0;', // 2
      '    while (i <= mid && j <= right) {', // 3
      '        if (arr[i] <= arr[j]) {', // 4
      '            temp[k++] = arr[i];', // 5
      '            i++;', // 6
      '        } else {', // 7
      '            temp[k++] = arr[j];', // 8
      '            j++;', // 9
      '        }', // 10
      '    }', // 11
      '    while (i <= mid) {', // 12
      '        temp[k++] = arr[i];', // 13
      '        i++;', // 14
      '    }', // 15
      '    while (j <= right) {', // 16
      '        temp[k++] = arr[j];', // 17
      '        j++;', // 18
      '    }', // 19
      '    for (k = 0; k < temp.length; k++) {', // 20
      '        arr[left + k] = temp[k];', // 21
      '    }', // 22
      '}', // 23
      '', // 24
      'void mergeSort(int[] arr, int left, int right) {', // 25
      '    if (left >= right) {', // 26
      '        return;', // 27
      '    }', // 28
      '    int mid = (left + right) / 2;', // 29
      '    mergeSort(arr, left, mid);', // 30
      '    mergeSort(arr, mid + 1, right);', // 31
      '    merge(arr, left, mid, right);', // 32
      '}', // 33
    ],
  },
  quickSort: {
    python: [
      'def partition(arr, low, high):', // 0
      '    pivot = arr[high]', // 1
      '    i = low - 1', // 2
      '    for j in range(low, high):', // 3
      '        if arr[j] < pivot:', // 4
      '            i += 1', // 5
      '            arr[i], arr[j] = arr[j], arr[i]', // 6
      '    arr[i + 1], arr[high] = arr[high], arr[i + 1]', // 7
      '    return i + 1', // 8
      '', // 9
      'def quick_sort(arr, low, high):', // 10
      '    if low < high:', // 11
      '        p = partition(arr, low, high)', // 12
      '        quick_sort(arr, low, p - 1)', // 13
      '        quick_sort(arr, p + 1, high)', // 14
    ],
    cpp: [
      'int partition(vector<int>& arr, int low, int high) {', // 0
      '    int pivot = arr[high];', // 1
      '    int i = low - 1;', // 2
      '    for (int j = low; j < high; j++) {', // 3
      '        if (arr[j] < pivot) {', // 4
      '            i++;', // 5
      '            swap(arr[i], arr[j]);', // 6
      '        }', // 7
      '    }', // 8
      '    swap(arr[i + 1], arr[high]);', // 9
      '    return i + 1;', // 10
      '}', // 11
      '', // 12
      'void quickSort(vector<int>& arr, int low, int high) {', // 13
      '    if (low < high) {', // 14
      '        int p = partition(arr, low, high);', // 15
      '        quickSort(arr, low, p - 1);', // 16
      '        quickSort(arr, p + 1, high);', // 17
      '    }', // 18
      '}', // 19
    ],
    java: [
      'int partition(int[] arr, int low, int high) {', // 0
      '    int pivot = arr[high];', // 1
      '    int i = low - 1;', // 2
      '    for (int j = low; j < high; j++) {', // 3
      '        if (arr[j] < pivot) {', // 4
      '            i++;', // 5
      '            int temp = arr[i];', // 6
      '            arr[i] = arr[j];', // 7
      '            arr[j] = temp;', // 8
      '        }', // 9
      '    }', // 10
      '    int temp = arr[i + 1];', // 11
      '    arr[i + 1] = arr[high];', // 12
      '    arr[high] = temp;', // 13
      '    return i + 1;', // 14
      '}', // 15
      '', // 16
      'void quickSort(int[] arr, int low, int high) {', // 17
      '    if (low < high) {', // 18
      '        int p = partition(arr, low, high);', // 19
      '        quickSort(arr, low, p - 1);', // 20
      '        quickSort(arr, p + 1, high);', // 21
      '    }', // 22
      '}', // 23
    ],
  },
  linearSearch: {
    python: [
      'def linear_search(arr, target):', // 0
      '    for i in range(len(arr)):', // 1
      '        if arr[i] == target:', // 2
      '            return i', // 3
      '    return -1', // 4
    ],
    cpp: [
      'int linearSearch(vector<int>& arr, int target) {', // 0
      '    for (int i = 0; i < arr.size(); i++) {', // 1
      '        if (arr[i] == target) {', // 2
      '            return i;', // 3
      '        }', // 4
      '    }', // 5
      '    return -1;', // 6
      '}', // 7
    ],
    java: [
      'int linearSearch(int[] arr, int target) {', // 0
      '    for (int i = 0; i < arr.length; i++) {', // 1
      '        if (arr[i] == target) {', // 2
      '            return i;', // 3
      '        }', // 4
      '    }', // 5
      '    return -1;', // 6
      '}', // 7
    ],
  },
  binarySearch: {
    python: [
      'def binary_search(arr, target):', // 0
      '    low, high = 0, len(arr) - 1', // 1
      '    while low <= high:', // 2
      '        mid = (low + high) // 2', // 3
      '        if arr[mid] == target:', // 4
      '            return mid', // 5
      '        elif arr[mid] < target:', // 6
      '            low = mid + 1', // 7
      '        else:', // 8
      '            high = mid - 1', // 9
      '    return -1', // 10
    ],
    cpp: [
      'int binarySearch(vector<int>& arr, int target) {', // 0
      '    int low = 0, high = arr.size() - 1;', // 1
      '    while (low <= high) {', // 2
      '        int mid = (low + high) / 2;', // 3
      '        if (arr[mid] == target) {', // 4
      '            return mid;', // 5
      '        } else if (arr[mid] < target) {', // 6
      '            low = mid + 1;', // 7
      '        } else {', // 8
      '            high = mid - 1;', // 9
      '        }', // 10
      '    }', // 11
      '    return -1;', // 12
      '}', // 13
    ],
    java: [
      'int binarySearch(int[] arr, int target) {', // 0
      '    int low = 0, high = arr.length - 1;', // 1
      '    while (low <= high) {', // 2
      '        int mid = (low + high) / 2;', // 3
      '        if (arr[mid] == target) {', // 4
      '            return mid;', // 5
      '        } else if (arr[mid] < target) {', // 6
      '            low = mid + 1;', // 7
      '        } else {', // 8
      '            high = mid - 1;', // 9
      '        }', // 10
      '    }', // 11
      '    return -1;', // 12
      '}', // 13
    ],
  },
}

const BUBBLE_LINES = {
  FUNCTION: 0,
  GET_LENGTH: 1,
  OUTER_LOOP: 2,
  INNER_LOOP: 3,
  COMPARE: 4,
  SWAP: 5,
}

const BUBBLE_OPTIMIZED_LINES = {
  FUNCTION: 0,
  GET_LENGTH: 1,
  OUTER_LOOP: 2,
  RESET_FLAG: 3,
  INNER_LOOP: 4,
  COMPARE: 5,
  SWAP: 6,
}

const SELECTION_LINES = {
  FUNCTION: 0,
  GET_LENGTH: 1,
  OUTER_LOOP: 2,
  SET_MIN: 3,
  INNER_LOOP: 4,
  COMPARE: 5,
  UPDATE_MIN: 6,
}

const INSERTION_LINES = {
  FUNCTION: 0,
  OUTER_LOOP: 1,
  SET_KEY: 2,
  SET_J: 3,
  WHILE: 4,
  SHIFT: 5,
  DECREMENT: 6,
}

const MERGE_BRACE_LINES = {
  MERGE_FUNCTION: 0,
  INIT_TEMP: 1,
  INIT_POINTERS: 2,
  WHILE_BOTH: 3,
  COMPARE: 4,
  TAKE_LEFT: 5,
  TAKE_RIGHT: 8,
  WHILE_LEFT: 12,
  COPY_LEFT: 13,
  WHILE_RIGHT: 16,
  COPY_RIGHT: 17,
  WRITE_LOOP: 20,
  WRITE_BACK: 21,
  SORT_FUNCTION: 25,
  BASE_CHECK: 26,
  RETURN: 27,
  MID: 29,
  RECURSE_LEFT: 30,
  RECURSE_RIGHT: 31,
  CALL_MERGE: 32,
}

const QUICK_LINES = {
  PARTITION_FUNCTION: 0,
  PIVOT: 1,
  INIT_I: 2,
  LOOP: 3,
  COMPARE: 4,
  INCREMENT_I: 5,
  SWAP: 6,
}

const LINEAR_BRACE_LINES = { FUNCTION: 0, LOOP: 1, COMPARE: 2, FOUND: 3, NOT_FOUND: 6 }

const BINARY_LINES = {
  FUNCTION: 0,
  INIT: 1,
  WHILE: 2,
  MID: 3,
  CHECK_EQUAL: 4,
  FOUND: 5,
  CHECK_LESS: 6,
  GO_RIGHT: 7,
  GO_LEFT: 9,
}

// Thao tác -> số dòng trong template tương ứng. Sửa template thì phải sửa cả bảng này.
export const codeLines = {
  bubbleSort: {
    python: BUBBLE_LINES,
    cpp: BUBBLE_LINES,
    java: BUBBLE_LINES,
  },
  bubbleSortOptimized: {
    python: { ...BUBBLE_OPTIMIZED_LINES, SET_FLAG: 7, CHECK_FLAG: 8, BREAK: 9 },
    cpp: { ...BUBBLE_OPTIMIZED_LINES, SET_FLAG: 7, CHECK_FLAG: 10, BREAK: 11 },
    java: { ...BUBBLE_OPTIMIZED_LINES, SET_FLAG: 9, CHECK_FLAG: 12, BREAK: 13 },
  },
  selectionSort: {
    python: { ...SELECTION_LINES, SWAP: 7 },
    cpp: { ...SELECTION_LINES, SWAP: 9 },
    java: { ...SELECTION_LINES, SWAP: 9 },
  },
  insertionSort: {
    python: { ...INSERTION_LINES, INSERT: 7 },
    cpp: { ...INSERTION_LINES, INSERT: 8 },
    java: { ...INSERTION_LINES, INSERT: 8 },
  },
  mergeSort: {
    python: {
      MERGE_FUNCTION: 0,
      INIT_TEMP: 1,
      INIT_POINTERS: 2,
      WHILE_BOTH: 3,
      COMPARE: 4,
      TAKE_LEFT: 5,
      TAKE_RIGHT: 8,
      WHILE_LEFT: 10,
      COPY_LEFT: 11,
      WHILE_RIGHT: 13,
      COPY_RIGHT: 14,
      WRITE_LOOP: 16,
      WRITE_BACK: 17,
      SORT_FUNCTION: 19,
      BASE_CHECK: 20,
      RETURN: 21,
      MID: 22,
      RECURSE_LEFT: 23,
      RECURSE_RIGHT: 24,
      CALL_MERGE: 25,
    },
    cpp: MERGE_BRACE_LINES,
    java: MERGE_BRACE_LINES,
  },
  quickSort: {
    python: {
      ...QUICK_LINES,
      PIVOT_SWAP: 7,
      RETURN: 8,
      SORT_FUNCTION: 10,
      CHECK: 11,
      CALL_PARTITION: 12,
      RECURSE_LEFT: 13,
      RECURSE_RIGHT: 14,
    },
    cpp: {
      ...QUICK_LINES,
      PIVOT_SWAP: 9,
      RETURN: 10,
      SORT_FUNCTION: 13,
      CHECK: 14,
      CALL_PARTITION: 15,
      RECURSE_LEFT: 16,
      RECURSE_RIGHT: 17,
    },
    java: {
      ...QUICK_LINES,
      PIVOT_SWAP: 11,
      RETURN: 14,
      SORT_FUNCTION: 17,
      CHECK: 18,
      CALL_PARTITION: 19,
      RECURSE_LEFT: 20,
      RECURSE_RIGHT: 21,
    },
  },
  linearSearch: {
    python: { FUNCTION: 0, LOOP: 1, COMPARE: 2, FOUND: 3, NOT_FOUND: 4 },
    cpp: LINEAR_BRACE_LINES,
    java: LINEAR_BRACE_LINES,
  },
  binarySearch: {
    python: { ...BINARY_LINES, NOT_FOUND: 10 },
    cpp: { ...BINARY_LINES, NOT_FOUND: 12 },
    java: { ...BINARY_LINES, NOT_FOUND: 12 },
  },
}
