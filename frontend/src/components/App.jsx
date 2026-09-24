import { Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import Sidebar from './Sidebar'
import InteractiveMap from './InteractiveMap'
import DetailPage from './DetailPage'
import PflanzenPage from './PflanzenPage'

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
    <div className="app-wrapper">
      <Sidebar />
      <div className="app-container">
        <h1>🌱 Gartenplan</h1>

        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/bereich/pflanzen" element={<PflanzenPage />} />
          <Route path="/bereich/:hotspotId" element={<DetailPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
