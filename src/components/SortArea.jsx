import ArrayNodes from './ArrayNodes.jsx'

// Mảng cho thuật toán sắp xếp: node vàng là đang so sánh, đỏ là vừa đổi chỗ / ghi đè,
// xanh lá là đã về đúng vị trí. Các biến chỉ số (i, j, low, mid...) hiện ngay dưới node.
function SortArea({ array, comparing, swapping, sorted, vars }) {
  return (
    <div className="flex min-h-48 flex-col justify-center rounded-xl border border-slate-700 bg-slate-900 p-4">
      <ArrayNodes
        array={array}
        comparing={comparing}
        swapping={swapping}
        sorted={sorted}
        vars={vars}
      />
    </div>
  )
}

export default SortArea
