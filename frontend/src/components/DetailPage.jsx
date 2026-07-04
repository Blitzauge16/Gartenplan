import React from 'react'
import hotspots from '../data/hotspots'

export default function DetailPage({ hotspotId, onBack }) {
  const hotspot = hotspots.find((h) => h.id === hotspotId) || hotspots.find((h) => h.route === hotspotId)

  return (
    <div className="detail-page">
      <button type="button" className="back-button" onClick={onBack}>
        ← Zurück
      </button>
      <h2>{hotspot ? hotspot.label : 'Detailseite'}</h2>
      <p>Details für: {hotspot ? hotspot.id : hotspotId}</p>
      <div className="detail-card">
        <p>Hier kannst du Inhalte für diese Fläche ergänzen (Text, Bilder, Formulare).</p>
      </div>
    </div>
  )
}
