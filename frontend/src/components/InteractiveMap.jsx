import React from 'react'
import grundstuecksplan from '../assets/grundstuecksplan.svg'
import hotspots from '../data/hotspots'

export default function InteractiveMap({ onHotspotClick }) {
  return (
    <svg viewBox="0 0 210 297" className="asset-svg" role="img" aria-label="Grundstücksplan">
      <image href={grundstuecksplan} x="0" y="0" width="210" height="297" preserveAspectRatio="xMidYMid meet" />

      {hotspots.map((h) => (
        <rect
          key={h.id}
          id={h.id}
          x={h.x}
          y={h.y}
          width={h.width}
          height={h.height}
          fill="transparent"
          stroke={h.stroke || 'transparent'}
          strokeWidth={1}
          strokeDasharray={h.strokeDasharray || '3 2'}
          style={{ cursor: 'pointer' }}
          onClick={() => onHotspotClick(h)}
        />
      ))}
    </svg>
  )
}
