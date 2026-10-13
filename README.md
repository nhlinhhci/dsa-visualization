# DSA Visualizer

Ứng dụng trực quan hóa thuật toán đồng bộ với code (React + Vite + Tailwind CSS). Sinh viên chọn thuật toán trên menu (Sort Algorithms / Search Algorithms), tự viết code bằng Python, C++ hoặc Java, bấm Run và xem mảng thay đổi theo đúng code của mình.

## Chạy dự án

```bash
npm install
npm run dev
```

`npm run dev` chạy cả giao diện lẫn API chạy code (`/api/*`) trên cùng một cổng.

## Yêu cầu trên máy chạy server

Code của sinh viên được chạy thật trên máy chủ, nên máy đó cần có sẵn trên `PATH`:

| Ngôn ngữ | Cần cài | Lệnh |
|---|---|---|
| Python | Python 3 | `python` (Windows) hoặc `python3` |
| C++ | GCC hoặc Clang hỗ trợ C++17 | `g++` hoặc `clang++` |
| Java | JDK 8 trở lên (không phải JRE) | `javac`, `java` |

Thiếu ngôn ngữ nào thì ngôn ngữ đó báo "Không chạy được" khi bấm Run; các ngôn ngữ còn lại vẫn dùng bình thường. Kiểm tra bằng `GET /api/health`.

## Bảo mật

Server chạy **code tùy ý** do người dùng gửi lên với quyền của tiến trình Node. Hiện chỉ có giới hạn thời gian (10 giây), giới hạn số bước (3000) và thư mục tạm riêng cho mỗi lần chạy — **không có sandbox**. Vì vậy server mặc định chỉ nghe trên `127.0.0.1`. Đừng mở ra mạng (`HOST=0.0.0.0`, `vite --host`) nếu chưa bọc phần chạy code trong container hoặc máy ảo.

## Hàm sinh viên cần viết

| Thuật toán | Python | C++ / Java |
|---|---|---|
| Bubble Sort | `bubble_sort(arr)` | `void bubbleSort(arr)` |
| Selection Sort | `selection_sort(arr)` | `void selectionSort(arr)` |
| Insertion Sort | `insertion_sort(arr)` | `void insertionSort(arr)` |
| Merge Sort | `merge_sort(arr, left, right)` | `void mergeSort(arr, int left, int right)` |
| Quick Sort | `quick_sort(arr, low, high)` | `void quickSort(arr, int low, int high)` |
| Linear Search | `linear_search(arr, target)` | `int linearSearch(arr, int target)` |
| Binary Search | `binary_search(arr, target)` | `int binarySearch(arr, int target)` |

`arr` là `vector<int>&` trong C++ và `int[]` trong Java. Hàm sắp xếp làm việc tại chỗ trên `arr` (Merge Sort và Quick Sort được gọi với `0` và `n - 1`); hàm tìm kiếm trả về index hoặc `-1`. Chữ ký đầy đủ nằm trong `src/data/algorithmSpecs.js`. Số dòng trong editor và trong thông báo lỗi đều bắt đầu từ 0.

## Scripts

- `npm run dev` — dev server (giao diện + API)
- `npm run build` — build production vào `dist/`
- `npm start` — server production: phục vụ `dist/` và API (cổng `PORT`, mặc định 3001)
- `npm run preview` — xem thử bản build (có kèm API)
- `npm run lint` — kiểm tra code bằng Oxlint

## Cấu trúc

- `src/data/codeTemplates.js` — code đáp án theo từng dòng và bảng `codeLines` (thao tác -> số dòng)
- `src/data/algorithmSpecs.js` — tên hàm, chữ ký và cách gọi của từng thuật toán (dùng chung với server)
- `src/algorithms/` — sinh `steps` cho code đáp án; `index.js` là danh sách thuật toán trên menu
- `src/components/` — `VisualizerArea` (cột), `SearchArea` (ô lưới), `IDEPanel` (CodeMirror), `RunConsole`, `AlgorithmMenu`
- `src/visualizers/` — `AlgorithmVisualizer` (khung chung), `SortingVisualizer`, `SearchingVisualizer`
- `src/api/runCode.js` — gọi API chạy code
- `server/runner.js` — biên dịch, chạy và chuyển trace thành `steps`
- `server/harness/` — phần theo dõi thực thi cho từng ngôn ngữ

Thêm thuật toán mới: thêm template và `codeLines` trong `codeTemplates.js`, thêm mục trong `algorithmSpecs.js`, viết hàm sinh step trong `src/algorithms/` rồi đăng ký vào `src/algorithms/index.js`.
