import { useState } from 'react'
import './App.css'
import InteractiveMap from './InteractiveMap'
import DetailPage from './DetailPage'

function App() {
  const [selectedHotspot, setSelectedHotspot] = useState(null)

  if (selectedHotspot) {
    return <DetailPage hotspotId={selectedHotspot} onBack={() => setSelectedHotspot(null)} />
  }

  return (
    <div className="app-container">
      <h1>🌱 Gartenplan - Interaktiv</h1>

      <section className="probe-section">
        <h2>Probe: Grundstücksplan aus SVG</h2>
        <div className="image-card">
          <InteractiveMap onHotspotClick={(id) => setSelectedHotspot(id)} />
        </div>
      </section>
    </div>
  )
}

export default App
