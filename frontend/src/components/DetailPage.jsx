export default function DetailPage({ hotspotId, onBack }) {
  return (
    <div className="detail-page">
      <button type="button" className="back-button" onClick={onBack}>
        ← Zurück
      </button>
      <h2>Detailseite</h2>
      <p>Details für: {hotspotId}</p>
      <div className="detail-card">
        <p>Hier kannst du Inhalte für diese Fläche ergänzen (Text, Bilder, Formulare).</p>
      </div>
    </div>
  )
}
