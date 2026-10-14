# DSA Visualizer

Ứng dụng trực quan hóa thuật toán đồng bộ với code (React + Vite + Tailwind CSS). Sinh viên chọn thuật toán trên menu (Sort Algorithms / Search Algorithms / Data Structures), tự viết code bằng Python, C++ hoặc Java, bấm Run và xem mảng thay đổi theo đúng code của mình.

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

Server chạy **code tùy ý** do người dùng gửi lên. Có hai chế độ:

- **Có sandbox** (`DSA_SANDBOX=1`, chỉ Linux, server chạy bằng root — Docker image đã bật sẵn): mỗi lượt chạy dùng một uid riêng không có quyền, không có mạng, thư mục tạm riêng, giới hạn số tiến trình / kích thước file / CPU, và mọi tiến trình còn sót bị diệt sau khi chạy xong.
- **Không sandbox** (mặc định khi chạy `npm run dev` / `npm start` trên máy cá nhân): code chạy với quyền của tiến trình Node. Server mặc định chỉ nghe trên `127.0.0.1`; đừng mở ra mạng ở chế độ này.

Cả hai chế độ đều giới hạn 10 giây và 3000 bước cho mỗi lượt chạy. Sandbox dựa trên uid và network namespace, không phải máy ảo riêng cho từng lượt, nên đừng để dữ liệu hay secret quan trọng trên máy chủ này. Trang không có đăng nhập: ai có link đều dùng được.

## Chạy cho lớp học trên máy cá nhân (miễn phí)

Không cần thuê server: bấm đúp `start-class.bat` trên máy Windows của giáo viên. Script sẽ:

1. Build và chạy app trong Docker **có sandbox** (code sinh viên không đụng được tới máy bạn).
2. Chạy `selftest` lần đầu và mỗi khi code thay đổi; nếu có mục lỗi sẽ hỏi trước khi mở cho lớp.
3. Mở đường hầm Cloudflare miễn phí (`cloudflared`, tự cài nếu thiếu) để có link `https://....trycloudflare.com` vào được từ mọi mạng.
4. Mở trang có link + mã QR để chiếu lên màn hình, đồng thời copy link vào clipboard.

Cần cài trước: [Docker Desktop](https://www.docker.com/products/docker-desktop/). Lần đầu build mất 5–10 phút, các lần sau vài giây.
Giữ cửa sổ mở suốt buổi học; nhấn Enter để tắt. Link Cloudflare đổi mỗi lần chạy lại.

Tùy chọn (chạy `.\start-class.ps1` từ PowerShell): `-Port 8090`, `-MaxRuns 8` (số lượt chạy code cùng lúc, mặc định 6), `-NoTunnel` (chỉ dùng WiFi chung), `-ForceTest`.

## Kiểm tra server chạy code

`npm run selftest` chạy mọi code đáp án ở các ngôn ngữ có trên máy; trong Docker (sandbox bật) nó thử thêm các giới hạn của sandbox. GitHub Actions build Docker image và chạy selftest mỗi lần push.

`MAX_CONCURRENT_RUNS` (mặc định 4 trong Docker image, `start-class` đặt 6) là số lượt chạy code đồng thời; các lượt còn lại xếp hàng.

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

### Data Structures: project Singly Linked List

IDE hiện một project hoàn chỉnh; 9 thao tác dùng chung một bộ file, chọn thao tác nào thì IDE mở file sinh viên viết và nhảy tới phương thức đó. Các file còn lại chỉ đọc, để tham khảo.

| Ngôn ngữ | File sinh viên viết | File chỉ đọc |
|---|---|---|
| Python | `main.py` — phần `class SLL` | `class Node` (đầu file) và `main()` (cuối file) trong cùng `main.py` |
| C++ | `SLL.cpp` | `SLL.h`, `Node.h`, `Node.cpp`, `main.cpp` |
| Java | `SLL.java` | `Node.java`, `Main.java` |

Mỗi thao tác là một phương thức của `SLL`, thay đổi `head` tại chỗ:

| Thao tác | Python | C++ / Java |
|---|---|---|
| Insert at Head / Tail | `insert_at_head(self, val)` / `insert_at_tail(self, val)` | `insertAtHead(int val)` / `insertAtTail(int val)` |
| Insert at Position | `insert_at_position(self, pos, val)` | `insertAtPosition(int pos, int val)` |
| Delete at Head / Tail | `delete_at_head(self)` / `delete_at_tail(self)` | `deleteAtHead()` / `deleteAtTail()` |
| Delete at Position | `delete_at_position(self, pos)` | `deleteAtPosition(int pos)` |
| Delete by Value | `delete_by_value(self, val)` | `deleteByValue(int val)` |
| Reverse | `reverse(self)` | `reverse()` |
| Traversal | `traverse(self)` | `traverse()` |

`main` được sinh theo danh sách / vị trí / giá trị đang nhập và đúng với những gì server chạy: dựng danh sách, gọi phương thức đang chọn, rồi chấm danh sách đi từ `head`. Vị trí `pos` tính từ 0; vị trí vượt quá độ dài danh sách thì giữ nguyên danh sách. Delete by Value xóa node đầu tiên có giá trị bằng `val`. Traversal in giá trị các node theo thứ tự (định dạng tùy ý, vd. `3 -> 1 -> 4`); chỉ các số nguyên trong output được dùng để chấm. Nội dung các file nằm trong `src/data/projects/singlyLinkedList.js` (dùng chung cho giao diện và server).

## Scripts

- `npm run dev` — dev server (giao diện + API)
- `npm run build` — build production vào `dist/`
- `npm start` — server production: phục vụ `dist/` và API (cổng `PORT`, mặc định 3001)
- `npm run preview` — xem thử bản build (có kèm API)
- `npm run lint` — kiểm tra code bằng Oxlint
- `npm run selftest` — tự kiểm tra server chạy code

## Cấu trúc

- `src/data/codeTemplates.js` — code đáp án theo từng dòng và bảng `codeLines` (thao tác -> số dòng)
- `src/data/algorithmSpecs.js` — tên hàm, chữ ký và cách gọi của từng thuật toán (dùng chung với server)
- `src/data/projects/singlyLinkedList.js` — các file của project Singly Linked List (dùng chung với server)
- `src/algorithms/` — sinh `steps` cho code đáp án; `index.js` là danh sách thuật toán trên menu
- `src/components/` — `LinkedListArea` (node + mũi tên next, SVG), `ArrayNodes` (mảng dạng node, kèm biến chỉ số), `SortArea`, `SearchArea`, `VariablesPanel`, `IDEPanel` (CodeMirror), `RunConsole`, `AlgorithmMenu`
- `src/visualizers/` — `AlgorithmVisualizer` (khung chung), `SortingVisualizer`, `SearchingVisualizer`, `LinkedListVisualizer`
- `src/api/runCode.js` — gọi API chạy code
- `server/runner.js` — biên dịch, chạy và chuyển trace thành `steps`
- `server/harness/` — phần theo dõi thực thi cho từng ngôn ngữ (project SLL: `cpp_sll_main.cpp` + gdb đi từng dòng trong `SLL.cpp`; Java: `MainSll.java`)
- `server/selftest.js` — tự kiểm tra: chạy mọi code đáp án và thử các giới hạn của sandbox
- `Dockerfile` — image có sẵn Python, g++, gdb, JDK và sandbox (dùng cho `start-class` và GitHub Actions)

Thêm thuật toán mới: thêm template và `codeLines` trong `codeTemplates.js`, thêm mục trong `algorithmSpecs.js`, viết hàm sinh step trong `src/algorithms/` rồi đăng ký vào `src/algorithms/index.js`.
