import { useState } from 'react'
import './App.css'
import InteractiveMap from './InteractiveMap'
import DetailPage from './DetailPage'

function App() {
  const [selectedHotspot, setSelectedHotspot] = useState(null)

  return (
    <div className="app-container">
      <h1>🌱 Gartenplan - Interaktiv</h1>

      <section className="main-layout">
        <div className="canvas-section">
          <h2>Gartenplan</h2>
          <div className="image-card">
            <InteractiveMap onHotspotClick={(id) => setSelectedHotspot(id)} />
          </div>
        </div>

        <div className="detail-section">
          <DetailPage hotspotId={selectedHotspot} onBack={() => setSelectedHotspot(null)} />
        </div>
      </section>
    </div>
  )
}

export default App
