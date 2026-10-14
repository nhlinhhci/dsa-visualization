# DSA Code-Driven Visualizer

## Tech Stack
- React (Vite)
- Tailwind CSS
- Lucide React (cho icons)

## Cấu trúc thư mục mục tiêu
- `src/data/codeTemplates.js` -> Chứa chuỗi code (Python/C++/Java) ánh xạ theo từng dòng.
- `src/algorithms/` -> Logic sinh các bước thực thi (snapshots) kèm số dòng code (line number).
- `src/components/` -> Các UI component dùng chung (Layout, Controls, IDE, Complexity).
- `src/visualizers/` -> Nơi lắp ghép giao diện (SortingVisualizer, SearchingVisualizer).

## Quy chuẩn Trực quan hóa & Đồng bộ Code
1. **Dữ liệu đầu vào:** Mảng số nguyên biểu diễn bằng các node (ô) nằm ngang cho cả Sorting và Searching; các biến chỉ số (i, j, low, mid...) hiện ngay dưới node chúng trỏ tới.
2. **Cơ chế Đồng bộ:** Thuật toán trong `src/algorithms/` chạy trước 1 lần trên mảng để sinh ra mảng các bước `steps`. Mỗi step bắt buộc phải có thuộc tính `lineHighlighted` để báo cho IDE biết cần tô sáng dòng nào.
3. **Trạng thái Màu sắc:**
   - Mặc định: `bg-blue-500` hoặc `bg-slate-300`
   - Đang so sánh (Comparing): `bg-yellow-500`
   - Đang hoán đổi (Swapping): `bg-red-500`
   - Đã hoàn thành (Sorted/Found): `bg-green-500`
