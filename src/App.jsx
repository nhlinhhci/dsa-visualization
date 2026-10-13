import { useState } from 'react'
import { algorithmCategories, algorithms } from './algorithms/index.js'
import AlgorithmMenu from './components/AlgorithmMenu.jsx'
import { getStarterCode } from './data/algorithmSpecs.js'
import SearchingVisualizer from './visualizers/SearchingVisualizer.jsx'
import SortingVisualizer from './visualizers/SortingVisualizer.jsx'

function App() {
  const [selectedId, setSelectedId] = useState(algorithms[0].id)
  const [language, setLanguage] = useState('python')
  // Code sinh viên tự viết, theo từng thuật toán và ngôn ngữ; chưa viết gì thì là khuôn hàm trống.
  // Chỉ giữ trong state: tải lại trang là IDE về lại khuôn hàm để sinh viên tự viết lại từ đầu.
  const [userCode, setUserCode] = useState({})

  const algorithm = algorithms.find((item) => item.id === selectedId)
  const Visualizer = algorithm.category === 'search' ? SearchingVisualizer : SortingVisualizer

  const handleUserCodeChange = (codeLanguage, value) => {
    setUserCode((current) => ({
      ...current,
      [selectedId]: { ...getStarterCode(selectedId), ...current[selectedId], [codeLanguage]: value },
    }))
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-xl font-bold">DSA Visualizer</span>
        <AlgorithmMenu
          categories={algorithmCategories}
          algorithms={algorithms}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* key: đổi thuật toán thì tạo lại mảng và trạng thái phát từ đầu. */}
      <Visualizer
        key={algorithm.id}
        algorithm={algorithm}
        language={language}
        setLanguage={setLanguage}
        userCode={userCode[selectedId] ?? getStarterCode(selectedId)}
        onUserCodeChange={handleUserCodeChange}
      />
    </div>
  )
}

export default App
