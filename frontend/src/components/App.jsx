import { Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import InteractiveMap from './InteractiveMap'
import DetailPage from './DetailPage'

function MapPage() {
  const navigate = useNavigate()

  return (
    <section className="main-layout">
      <div className="canvas-section">
        <h2>Gartenplan</h2>
        <div className="image-card">
          <InteractiveMap onHotspotClick={(id) => navigate(`/bereich/${id}`)} />
        </div>
      </div>
    </section>
  )
}

function App() {
  return (
    <div className="app-container">
      <h1>🌱 Gartenplan</h1>

      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/bereich/:hotspotId" element={<DetailPage />} />
      </Routes>
    </div>
  )
}

export default App
