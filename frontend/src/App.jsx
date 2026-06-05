import { useState } from 'react'
import './App.css'

function App() {
  const [selectedElement, setSelectedElement] = useState(null)
  const [elements, setElements] = useState([
    { id: 1, name: 'Tomate', x: 100, y: 100, color: '#FF6B6B' },
    { id: 2, name: 'Salat', x: 250, y: 150, color: '#4ECDC4' },
    { id: 3, name: 'Karotte', x: 150, y: 300, color: '#FFE66D' },
  ])

  const handleElementClick = (id) => {
    setSelectedElement(id)
  }

  return (
    <div className="app-container">
      <h1>🌱 Gartenplan - Interaktiv</h1>
      
      <div className="main-layout">
        {/* SVG Canvas */}
        <div className="canvas-section">
          <svg width="600" height="400" viewBox="0 0 600 400" className="garden-svg">
            {/* Garten Rahmen */}
            <rect x="20" y="20" width="560" height="360" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2" />
            
            {/* Gartenbeet Wege */}
            <line x1="300" y1="20" x2="300" y2="380" stroke="#A1887F" strokeWidth="3" />
            <line x1="20" y1="200" x2="580" y2="200" stroke="#A1887F" strokeWidth="3" />

            {/* Pflanzen */}
            {elements.map((element) => (
              <g key={element.id}>
                {/* Pflanze Kreis */}
                <circle
                  cx={element.x}
                  cy={element.y}
                  r="30"
                  fill={element.color}
                  stroke={selectedElement === element.id ? '#000' : '#333'}
                  strokeWidth={selectedElement === element.id ? '3' : '2'}
                  onClick={() => handleElementClick(element.id)}
                  style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
                />
                {/* Label */}
                <text
                  x={element.x}
                  y={element.y + 50}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#333"
                  pointerEvents="none"
                >
                  {element.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Control Panel */}
        <aside className="control-panel">
          <h2>📋 Element-Manager</h2>
          
          {selectedElement ? (
            <div className="properties">
              <h3>Eigenschaften</h3>
              <p><strong>Element:</strong> {elements.find(e => e.id === selectedElement)?.name}</p>
              <p><strong>Position:</strong> X: {elements.find(e => e.id === selectedElement)?.x}, Y: {elements.find(e => e.id === selectedElement)?.y}</p>
              <button onClick={() => setSelectedElement(null)}>Deselektieren</button>
            </div>
          ) : (
            <p>Klick auf ein Element um Details zu sehen</p>
          )}

          <h3>Alle Elemente</h3>
          <ul className="elements-list">
            {elements.map((element) => (
              <li
                key={element.id}
                onClick={() => handleElementClick(element.id)}
                className={selectedElement === element.id ? 'active' : ''}
              >
                <span className="color-dot" style={{ backgroundColor: element.color }}></span>
                {element.name}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}

export default App
