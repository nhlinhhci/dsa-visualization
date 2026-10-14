// Vẽ danh sách liên kết: mỗi node là ô [giá trị | next], mũi tên từ ô next tới node kế tiếp,
// tên các biến đang trỏ vào node hiện phía trên node đó.
const VAL_W = 46
const PTR_W = 28
const NODE_W = VAL_W + PTR_W
const NODE_H = 40
const COL_W = NODE_W + 44
const ROW_H = 108
// Khoảng trống phía trên mỗi hàng cho nhãn tên biến.
const LABEL_SPACE = 52
const PAD = 16

const isNodeRef = (value) => value !== null && typeof value === 'object' && 'node' in value

// Các biến trỏ vào node, `head` trước (để danh sách chính luôn nằm hàng trên cùng), rồi theo thứ tự khai báo.
function getRoots(step) {
  if (step.resultNode !== undefined) {
    return step.resultNode ? [{ name: step.resultLabel ?? 'kết quả', id: step.resultNode }] : []
  }
  const roots = Object.entries(step.vars ?? {})
    .filter(([, value]) => isNodeRef(value))
    .map(([name, value]) => ({ name, id: value.node }))
  const isHead = (root) => root.name === 'head' || root.name === 'self.head'
  return roots.sort((a, b) => isHead(b) - isHead(a))
}

// Xếp node theo hàng: mỗi biến (theo thứ tự ở trên) mở một hàng mới nếu node nó trỏ tới chưa có chỗ,
// rồi đi theo next cho tới node đã xếp hoặc null. Node còn lại (không biến nào tới được) xếp cuối.
function layout(heap, roots) {
  const nodes = new Map(heap.map((node) => [node.id, node]))
  const positions = new Map()
  const rows = []
  const placeChain = (startId) => {
    if (startId === null || positions.has(startId) || !nodes.has(startId)) return
    const row = []
    let id = startId
    while (id !== null && nodes.has(id) && !positions.has(id)) {
      positions.set(id, { row: rows.length, col: row.length })
      row.push(id)
      id = nodes.get(id).next
    }
    rows.push(row)
  }
  roots.forEach((root) => placeChain(root.id))
  heap.forEach((node) => placeChain(node.id))
  return { positions, rowCount: rows.length, colCount: Math.max(0, ...rows.map((row) => row.length)) }
}

const nodeX = (position) => PAD + position.col * COL_W
const nodeY = (position) => PAD + LABEL_SPACE + position.row * ROW_H

// Đường từ ô next của node nguồn tới node đích:
//   - node liền sau trên cùng hàng: mũi tên thẳng vào cạnh trái;
//   - cùng hàng nhưng xa hơn hoặc trỏ ngược: vòng xuống dưới hàng rồi vào cạnh trái;
//   - khác hàng: cong lên/xuống, đi vào cạnh dưới/trên của node đích.
function arrowPath(from, to) {
  const sx = nodeX(from) + VAL_W + PTR_W / 2
  const sy = nodeY(from) + NODE_H / 2
  if (from.row === to.row) {
    const tx = nodeX(to) - 3
    const ty = nodeY(to) + NODE_H / 2
    if (to.col === from.col + 1) return `M ${sx} ${sy} L ${tx} ${ty}`
    const bend = NODE_H + 18
    return `M ${sx} ${sy} C ${sx + 60} ${sy + bend}, ${tx - 60} ${ty + bend}, ${tx} ${ty}`
  }
  const above = to.row < from.row
  const tx = nodeX(to) + VAL_W / 2
  const ty = above ? nodeY(to) + NODE_H + 3 : nodeY(to) - 3
  const pull = above ? 40 : -40
  return `M ${sx} ${sy} C ${sx + 40} ${sy}, ${tx} ${ty + pull}, ${tx} ${ty}`
}

// `step.heap`: [{ id, val, next }]; `step.vars`: biến, trong đó biến trỏ tới node là { node, val };
// `step.active`: node đang được xét; `step.resultNode`/`step.correct`: chỉ có ở bước kết thúc;
// `step.printed`: giá trị đã in ra (Traversal). `inputs`: [{ label, value }] hiện phía trên (vị trí, giá trị).
// Node mới xuất hiện và liên kết vừa đổi (so với `previousStep`) được tô nổi bật.
function LinkedListArea({ step, previousStep, inputs = [] }) {
  const heap = step.heap ?? []
  const roots = getRoots(step)
  const { positions, rowCount, colCount } = layout(heap, roots)
  const previousHeap = new Map((previousStep?.heap ?? []).map((node) => [node.id, node]))
  const isFinal = step.resultNode !== undefined
  const active = new Set(step.active ?? [])

  const labels = new Map()
  for (const root of roots) labels.set(root.id, [...(labels.get(root.id) ?? []), root.name])
  const nullPointers = Object.entries(step.vars ?? {})
    .filter(([, value]) => value === null)
    .map(([name]) => name)

  const width = PAD * 2 + Math.max(colCount, 1) * COL_W
  const height = PAD * 2 + LABEL_SPACE + Math.max(rowCount, 1) * ROW_H - (ROW_H - NODE_H) + 24

  const nodeFill = (node) => {
    if (isFinal) return step.correct ? '#22c55e' : '#cbd5e1'
    if (active.has(node.id)) return '#eab308'
    if (previousStep && !previousHeap.has(node.id)) return '#6ee7b7'
    return '#cbd5e1'
  }
  const isLinkChanged = (node) =>
    previousHeap.has(node.id) && previousHeap.get(node.id).next !== node.next

  return (
    <div className="flex min-h-48 flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      {inputs.length > 0 && (
        <p className="flex flex-wrap gap-4 text-sm text-slate-300">
          {inputs.map(({ label, value }) => (
            <span key={label}>
              {label}:{' '}
              <span className="rounded-md bg-slate-800 px-2 py-1 font-mono font-semibold text-emerald-300">
                {value}
              </span>
            </span>
          ))}
        </p>
      )}

      {heap.length === 0 ? (
        <p className="flex flex-1 items-center justify-center font-mono text-sm text-slate-400">
          {isFinal ? 'Kết quả: danh sách rỗng (null)' : 'Danh sách rỗng (head = null)'}
        </p>
      ) : (
        <div>
          {/* Co lại vừa bề rộng khung (không phóng to quá kích thước thật). */}
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', maxWidth: width }}
            className="mx-auto block"
            role="img"
            aria-label="Danh sách liên kết"
          >
            <defs>
              {[
                ['arrow', '#94a3b8'],
                ['arrow-changed', '#ef4444'],
              ].map(([id, color]) => (
                <marker
                  key={id}
                  id={id}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                </marker>
              ))}
            </defs>

            {heap.map((node) => {
              const from = positions.get(node.id)
              const to = node.next !== null ? positions.get(node.next) : null
              if (!from || !to) return null
              const changed = isLinkChanged(node)
              return (
                <path
                  key={`link-${node.id}`}
                  d={arrowPath(from, to)}
                  fill="none"
                  stroke={changed ? '#ef4444' : '#94a3b8'}
                  strokeWidth={changed ? 2.5 : 1.75}
                  markerEnd={`url(#${changed ? 'arrow-changed' : 'arrow'})`}
                />
              )
            })}

            {heap.map((node) => {
              const position = positions.get(node.id)
              if (!position) return null
              const changed = isLinkChanged(node)
              const names = labels.get(node.id) ?? []
              return (
                <g
                  key={node.id}
                  style={{
                    transform: `translate(${nodeX(position)}px, ${nodeY(position)}px)`,
                    transition: 'transform 300ms ease',
                  }}
                >
                  {names.map((name, index) => (
                    <text
                      key={name}
                      x={NODE_W / 2}
                      y={-10 - index * 16}
                      textAnchor="middle"
                      className="fill-emerald-300 font-mono text-xs"
                    >
                      {name}
                      {index === 0 ? ' ↓' : ''}
                    </text>
                  ))}
                  <rect width={VAL_W} height={NODE_H} rx="6" fill={nodeFill(node)} />
                  <text
                    x={VAL_W / 2}
                    y={NODE_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-slate-900 font-mono text-sm font-semibold"
                  >
                    {node.val}
                  </text>
                  <rect
                    x={VAL_W}
                    width={PTR_W}
                    height={NODE_H}
                    rx="6"
                    fill={changed ? '#fecaca' : '#e2e8f0'}
                    stroke="#0f172a"
                    strokeWidth="1"
                  />
                  {node.next === null ? (
                    // next = null: gạch chéo trong ô next.
                    <line
                      x1={VAL_W + 6}
                      y1={NODE_H - 8}
                      x2={NODE_W - 6}
                      y2={8}
                      stroke="#475569"
                      strokeWidth="2"
                    />
                  ) : (
                    <circle cx={VAL_W + PTR_W / 2} cy={NODE_H / 2} r="3.5" fill="#0f172a" />
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {step.printed && (
        <p className="font-mono text-xs text-slate-400">
          Đã in: <span className="text-yellow-300">{step.printed.join(' ') || '(chưa in gì)'}</span>
        </p>
      )}

      {nullPointers.length > 0 && (
        <p className="font-mono text-xs text-slate-400">
          Trỏ tới null: <span className="text-emerald-300">{nullPointers.join(', ')}</span>
        </p>
      )}
    </div>
  )
}

export default LinkedListArea
