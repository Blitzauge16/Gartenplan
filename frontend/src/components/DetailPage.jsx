import hotspotMeta from '../data/hotspotMeta'

export default function DetailPage({ hotspotId, onBack }) {
  const meta = hotspotMeta[hotspotId]
  const isSelected = Boolean(hotspotId)

  return (
    <div className="detail-page">
      <div className="detail-header">
        <h2>{isSelected ? meta?.title : 'Wähle einen Bereich aus'}</h2>
        {isSelected && (
          <button type="button" className="back-button" onClick={onBack}>
            ← Zurück
          </button>
        )}
      </div>

      {isSelected ? (
        <>
          <p className="detail-key">Hotspot-ID: {hotspotId}</p>
          <div className="detail-card">
            <p>{meta?.description}</p>
            <p><strong>Tipp:</strong> Du kannst weitere Informationen in `hotspotMeta.js` ergänzen.</p>
          </div>
        </>
      ) : (
        <div className="detail-card">
          <p>Wähle einen klickbaren Bereich im Gartenplan aus, um ihn genauer zu beschreiben.</p>
        </div>
      )}
    </div>
  )
}
