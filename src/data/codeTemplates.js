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
  // --- Singly Linked List: mỗi thao tác là một phương thức của class SLL (thay đổi head tại chỗ).
  // Python: phương thức trong class (thụt 4 dấu cách); C++: định nghĩa trong SLL.cpp; Java: trong
  // class SLL. Số dòng tính từ dòng khai báo phương thức; project ghép các phương thức thành file
  // (src/data/projects/singlyLinkedList.js).
  insertAtHead: {
    python: [
      '    def insert_at_head(self, val):', // 0
      '        new_node = Node(val)', // 1
      '        new_node.next = self.head', // 2
      '        self.head = new_node', // 3
    ],
    cpp: [
      'void SLL::insertAtHead(int val) {', // 0
      '    Node* newNode = new Node(val);', // 1
      '    newNode->next = head;', // 2
      '    head = newNode;', // 3
      '}', // 4
    ],
    java: [
      '    public void insertAtHead(int val) {', // 0
      '        Node newNode = new Node(val);', // 1
      '        newNode.next = head;', // 2
      '        head = newNode;', // 3
      '    }', // 4
    ],
  },
  insertAtTail: {
    python: [
      '    def insert_at_tail(self, val):', // 0
      '        new_node = Node(val)', // 1
      '        if self.head is None:', // 2
      '            self.head = new_node', // 3
      '            return', // 4
      '        curr = self.head', // 5
      '        while curr.next is not None:', // 6
      '            curr = curr.next', // 7
      '        curr.next = new_node', // 8
    ],
    cpp: [
      'void SLL::insertAtTail(int val) {', // 0
      '    Node* newNode = new Node(val);', // 1
      '    if (head == nullptr) {', // 2
      '        head = newNode;', // 3
      '        return;', // 4
      '    }', // 5
      '    Node* curr = head;', // 6
      '    while (curr->next != nullptr) {', // 7
      '        curr = curr->next;', // 8
      '    }', // 9
      '    curr->next = newNode;', // 10
      '}', // 11
    ],
    java: [
      '    public void insertAtTail(int val) {', // 0
      '        Node newNode = new Node(val);', // 1
      '        if (head == null) {', // 2
      '            head = newNode;', // 3
      '            return;', // 4
      '        }', // 5
      '        Node curr = head;', // 6
      '        while (curr.next != null) {', // 7
      '            curr = curr.next;', // 8
      '        }', // 9
      '        curr.next = newNode;', // 10
      '    }', // 11
    ],
  },
  insertAtPosition: {
    python: [
      '    def insert_at_position(self, pos, val):', // 0
      '        if pos == 0:', // 1
      '            new_node = Node(val)', // 2
      '            new_node.next = self.head', // 3
      '            self.head = new_node', // 4
      '            return', // 5
      '        curr = self.head', // 6
      '        index = 0', // 7
      '        while curr is not None and index < pos - 1:', // 8
      '            curr = curr.next', // 9
      '            index += 1', // 10
      '        if curr is None:', // 11
      '            return', // 12
      '        new_node = Node(val)', // 13
      '        new_node.next = curr.next', // 14
      '        curr.next = new_node', // 15
    ],
    cpp: [
      'void SLL::insertAtPosition(int pos, int val) {', // 0
      '    if (pos == 0) {', // 1
      '        Node* newNode = new Node(val);', // 2
      '        newNode->next = head;', // 3
      '        head = newNode;', // 4
      '        return;', // 5
      '    }', // 6
      '    Node* curr = head;', // 7
      '    int index = 0;', // 8
      '    while (curr != nullptr && index < pos - 1) {', // 9
      '        curr = curr->next;', // 10
      '        index++;', // 11
      '    }', // 12
      '    if (curr == nullptr) {', // 13
      '        return;', // 14
      '    }', // 15
      '    Node* newNode = new Node(val);', // 16
      '    newNode->next = curr->next;', // 17
      '    curr->next = newNode;', // 18
      '}', // 19
    ],
    java: [
      '    public void insertAtPosition(int pos, int val) {', // 0
      '        if (pos == 0) {', // 1
      '            Node newNode = new Node(val);', // 2
      '            newNode.next = head;', // 3
      '            head = newNode;', // 4
      '            return;', // 5
      '        }', // 6
      '        Node curr = head;', // 7
      '        int index = 0;', // 8
      '        while (curr != null && index < pos - 1) {', // 9
      '            curr = curr.next;', // 10
      '            index++;', // 11
      '        }', // 12
      '        if (curr == null) {', // 13
      '            return;', // 14
      '        }', // 15
      '        Node newNode = new Node(val);', // 16
      '        newNode.next = curr.next;', // 17
      '        curr.next = newNode;', // 18
      '    }', // 19
    ],
  },
  deleteAtHead: {
    python: [
      '    def delete_at_head(self):', // 0
      '        if self.head is None:', // 1
      '            return', // 2
      '        old_head = self.head', // 3
      '        self.head = self.head.next', // 4
      '        old_head.next = None', // 5
    ],
    cpp: [
      'void SLL::deleteAtHead() {', // 0
      '    if (head == nullptr) {', // 1
      '        return;', // 2
      '    }', // 3
      '    Node* oldHead = head;', // 4
      '    head = head->next;', // 5
      '    oldHead->next = nullptr;', // 6
      '}', // 7
    ],
    java: [
      '    public void deleteAtHead() {', // 0
      '        if (head == null) {', // 1
      '            return;', // 2
      '        }', // 3
      '        Node oldHead = head;', // 4
      '        head = head.next;', // 5
      '        oldHead.next = null;', // 6
      '    }', // 7
    ],
  },
  deleteAtTail: {
    python: [
      '    def delete_at_tail(self):', // 0
      '        if self.head is None:', // 1
      '            return', // 2
      '        if self.head.next is None:', // 3
      '            self.head = None', // 4
      '            return', // 5
      '        curr = self.head', // 6
      '        while curr.next.next is not None:', // 7
      '            curr = curr.next', // 8
      '        curr.next = None', // 9
    ],
    cpp: [
      'void SLL::deleteAtTail() {', // 0
      '    if (head == nullptr) {', // 1
      '        return;', // 2
      '    }', // 3
      '    if (head->next == nullptr) {', // 4
      '        head = nullptr;', // 5
      '        return;', // 6
      '    }', // 7
      '    Node* curr = head;', // 8
      '    while (curr->next->next != nullptr) {', // 9
      '        curr = curr->next;', // 10
      '    }', // 11
      '    curr->next = nullptr;', // 12
      '}', // 13
    ],
    java: [
      '    public void deleteAtTail() {', // 0
      '        if (head == null) {', // 1
      '            return;', // 2
      '        }', // 3
      '        if (head.next == null) {', // 4
      '            head = null;', // 5
      '            return;', // 6
      '        }', // 7
      '        Node curr = head;', // 8
      '        while (curr.next.next != null) {', // 9
      '            curr = curr.next;', // 10
      '        }', // 11
      '        curr.next = null;', // 12
      '    }', // 13
    ],
  },
  deleteAtPosition: {
    python: [
      '    def delete_at_position(self, pos):', // 0
      '        if self.head is None:', // 1
      '            return', // 2
      '        if pos == 0:', // 3
      '            self.head = self.head.next', // 4
      '            return', // 5
      '        curr = self.head', // 6
      '        index = 0', // 7
      '        while curr.next is not None and index < pos - 1:', // 8
      '            curr = curr.next', // 9
      '            index += 1', // 10
      '        if curr.next is None:', // 11
      '            return', // 12
      '        curr.next = curr.next.next', // 13
    ],
    cpp: [
      'void SLL::deleteAtPosition(int pos) {', // 0
      '    if (head == nullptr) {', // 1
      '        return;', // 2
      '    }', // 3
      '    if (pos == 0) {', // 4
      '        head = head->next;', // 5
      '        return;', // 6
      '    }', // 7
      '    Node* curr = head;', // 8
      '    int index = 0;', // 9
      '    while (curr->next != nullptr && index < pos - 1) {', // 10
      '        curr = curr->next;', // 11
      '        index++;', // 12
      '    }', // 13
      '    if (curr->next == nullptr) {', // 14
      '        return;', // 15
      '    }', // 16
      '    curr->next = curr->next->next;', // 17
      '}', // 18
    ],
    java: [
      '    public void deleteAtPosition(int pos) {', // 0
      '        if (head == null) {', // 1
      '            return;', // 2
      '        }', // 3
      '        if (pos == 0) {', // 4
      '            head = head.next;', // 5
      '            return;', // 6
      '        }', // 7
      '        Node curr = head;', // 8
      '        int index = 0;', // 9
      '        while (curr.next != null && index < pos - 1) {', // 10
      '            curr = curr.next;', // 11
      '            index++;', // 12
      '        }', // 13
      '        if (curr.next == null) {', // 14
      '            return;', // 15
      '        }', // 16
      '        curr.next = curr.next.next;', // 17
      '    }', // 18
    ],
  },
  deleteValue: {
    python: [
      '    def delete_by_value(self, val):', // 0
      '        if self.head is None:', // 1
      '            return', // 2
      '        if self.head.val == val:', // 3
      '            self.head = self.head.next', // 4
      '            return', // 5
      '        prev = self.head', // 6
      '        curr = self.head.next', // 7
      '        while curr is not None:', // 8
      '            if curr.val == val:', // 9
      '                prev.next = curr.next', // 10
      '                return', // 11
      '            prev = curr', // 12
      '            curr = curr.next', // 13
    ],
    cpp: [
      'void SLL::deleteByValue(int val) {', // 0
      '    if (head == nullptr) {', // 1
      '        return;', // 2
      '    }', // 3
      '    if (head->val == val) {', // 4
      '        head = head->next;', // 5
      '        return;', // 6
      '    }', // 7
      '    Node* prev = head;', // 8
      '    Node* curr = head->next;', // 9
      '    while (curr != nullptr) {', // 10
      '        if (curr->val == val) {', // 11
      '            prev->next = curr->next;', // 12
      '            return;', // 13
      '        }', // 14
      '        prev = curr;', // 15
      '        curr = curr->next;', // 16
      '    }', // 17
      '}', // 18
    ],
    java: [
      '    public void deleteByValue(int val) {', // 0
      '        if (head == null) {', // 1
      '            return;', // 2
      '        }', // 3
      '        if (head.val == val) {', // 4
      '            head = head.next;', // 5
      '            return;', // 6
      '        }', // 7
      '        Node prev = head;', // 8
      '        Node curr = head.next;', // 9
      '        while (curr != null) {', // 10
      '            if (curr.val == val) {', // 11
      '                prev.next = curr.next;', // 12
      '                return;', // 13
      '            }', // 14
      '            prev = curr;', // 15
      '            curr = curr.next;', // 16
      '        }', // 17
      '    }', // 18
    ],
  },
  reverseList: {
    python: [
      '    def reverse(self):', // 0
      '        prev = None', // 1
      '        curr = self.head', // 2
      '        while curr is not None:', // 3
      '            next_node = curr.next', // 4
      '            curr.next = prev', // 5
      '            prev = curr', // 6
      '            curr = next_node', // 7
      '        self.head = prev', // 8
    ],
    cpp: [
      'void SLL::reverse() {', // 0
      '    Node* prev = nullptr;', // 1
      '    Node* curr = head;', // 2
      '    while (curr != nullptr) {', // 3
      '        Node* nextNode = curr->next;', // 4
      '        curr->next = prev;', // 5
      '        prev = curr;', // 6
      '        curr = nextNode;', // 7
      '    }', // 8
      '    head = prev;', // 9
      '}', // 10
    ],
    java: [
      '    public void reverse() {', // 0
      '        Node prev = null;', // 1
      '        Node curr = head;', // 2
      '        while (curr != null) {', // 3
      '            Node nextNode = curr.next;', // 4
      '            curr.next = prev;', // 5
      '            prev = curr;', // 6
      '            curr = nextNode;', // 7
      '        }', // 8
      '        head = prev;', // 9
      '    }', // 10
    ],
  },
  traverse: {
    python: [
      '    def traverse(self):', // 0
      '        curr = self.head', // 1
      '        while curr is not None:', // 2
      '            print(curr.val, end=\' \')', // 3
      '            curr = curr.next', // 4
    ],
    cpp: [
      'void SLL::traverse() {', // 0
      '    Node* curr = head;', // 1
      '    while (curr != nullptr) {', // 2
      '        std::cout << curr->val << " ";', // 3
      '        curr = curr->next;', // 4
      '    }', // 5
      '}', // 6
    ],
    java: [
      '    public void traverse() {', // 0
      '        Node curr = head;', // 1
      '        while (curr != null) {', // 2
      '            System.out.print(curr.val + " ");', // 3
      '            curr = curr.next;', // 4
      '        }', // 5
      '    }', // 6
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


// Line map cho phương thức SLL: `python` đầy đủ; bản C++/Java (dùng chung số dòng) lấy theo Python,
// chỉ ghi đè các thao tác lệch dòng vì có thêm dòng `}`.
const sllLines = (python, braceOverrides) => {
  const brace = { ...python, ...braceOverrides }
  return { python, cpp: brace, java: brace }
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
  // Singly Linked List: số dòng tính từ dòng khai báo phương thức (C++ và Java giống nhau).
  insertAtHead: sllLines({ FUNCTION: 0, CREATE: 1, LINK: 2, MOVE_HEAD: 3 }, {}),
  insertAtTail: sllLines(
    { FUNCTION: 0, CREATE: 1, CHECK_EMPTY: 2, SET_HEAD: 3, RETURN_EARLY: 4, INIT_CURR: 5, WHILE: 6, ADVANCE: 7, LINK: 8 },
    { INIT_CURR: 6, WHILE: 7, ADVANCE: 8, LINK: 10 },
  ),
  insertAtPosition: sllLines(
    {
      FUNCTION: 0,
      CHECK_FRONT: 1,
      CREATE_FRONT: 2,
      LINK_FRONT: 3,
      MOVE_HEAD: 4,
      RETURN_FRONT: 5,
      INIT_CURR: 6,
      INIT_INDEX: 7,
      WHILE: 8,
      ADVANCE: 9,
      INCREMENT: 10,
      CHECK_NULL: 11,
      RETURN_UNCHANGED: 12,
      CREATE: 13,
      LINK: 14,
      ATTACH: 15,
    },
    {
      INIT_CURR: 7,
      INIT_INDEX: 8,
      WHILE: 9,
      ADVANCE: 10,
      INCREMENT: 11,
      CHECK_NULL: 13,
      RETURN_UNCHANGED: 14,
      CREATE: 16,
      LINK: 17,
      ATTACH: 18,
    },
  ),
  deleteAtHead: sllLines(
    { FUNCTION: 0, CHECK_EMPTY: 1, RETURN_EMPTY: 2, SAVE_OLD: 3, MOVE_HEAD: 4, DETACH: 5 },
    { SAVE_OLD: 4, MOVE_HEAD: 5, DETACH: 6 },
  ),
  deleteAtTail: sllLines(
    {
      FUNCTION: 0,
      CHECK_EMPTY: 1,
      RETURN_EMPTY: 2,
      CHECK_SINGLE: 3,
      CLEAR: 4,
      RETURN_SINGLE: 5,
      INIT_CURR: 6,
      WHILE: 7,
      ADVANCE: 8,
      DETACH: 9,
    },
    { CHECK_SINGLE: 4, CLEAR: 5, RETURN_SINGLE: 6, INIT_CURR: 8, WHILE: 9, ADVANCE: 10, DETACH: 12 },
  ),
  deleteAtPosition: sllLines(
    {
      FUNCTION: 0,
      CHECK_EMPTY: 1,
      RETURN_EMPTY: 2,
      CHECK_FRONT: 3,
      MOVE_HEAD: 4,
      RETURN_FRONT: 5,
      INIT_CURR: 6,
      INIT_INDEX: 7,
      WHILE: 8,
      ADVANCE: 9,
      INCREMENT: 10,
      CHECK_NULL: 11,
      RETURN_UNCHANGED: 12,
      UNLINK: 13,
    },
    {
      CHECK_FRONT: 4,
      MOVE_HEAD: 5,
      RETURN_FRONT: 6,
      INIT_CURR: 8,
      INIT_INDEX: 9,
      WHILE: 10,
      ADVANCE: 11,
      INCREMENT: 12,
      CHECK_NULL: 14,
      RETURN_UNCHANGED: 15,
      UNLINK: 17,
    },
  ),
  deleteValue: sllLines(
    {
      FUNCTION: 0,
      CHECK_EMPTY: 1,
      RETURN_EMPTY: 2,
      CHECK_HEAD: 3,
      MOVE_HEAD: 4,
      RETURN_HEAD: 5,
      INIT_PREV: 6,
      INIT_CURR: 7,
      WHILE: 8,
      COMPARE: 9,
      UNLINK: 10,
      RETURN_FOUND: 11,
      ADVANCE_PREV: 12,
      ADVANCE_CURR: 13,
    },
    {
      CHECK_HEAD: 4,
      MOVE_HEAD: 5,
      RETURN_HEAD: 6,
      INIT_PREV: 8,
      INIT_CURR: 9,
      WHILE: 10,
      COMPARE: 11,
      UNLINK: 12,
      RETURN_FOUND: 13,
      ADVANCE_PREV: 15,
      ADVANCE_CURR: 16,
    },
  ),
  reverseList: sllLines(
    {
      FUNCTION: 0,
      INIT_PREV: 1,
      INIT_CURR: 2,
      WHILE: 3,
      SAVE_NEXT: 4,
      REVERSE_LINK: 5,
      ADVANCE_PREV: 6,
      ADVANCE_CURR: 7,
      SET_HEAD: 8,
    },
    { SET_HEAD: 9 },
  ),
  traverse: sllLines({ FUNCTION: 0, INIT_CURR: 1, WHILE: 2, VISIT: 3, ADVANCE: 4 }, {}),
}
