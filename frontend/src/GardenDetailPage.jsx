function GardenDetailPage({ onBack }) {
  return (
    <div className="detail-page">
      <button type="button" className="back-button" onClick={onBack}>
        ← Zurück zum Gartenplan
      </button>

      <h2>Detailseite für die klickbare Fläche</h2>
      <p>
        Diese Seite wird geöffnet, wenn du auf die klickbare Fläche klickst.
      </p>

      <div className="detail-card">
        <h3>Was du hier ergänzen kannst</h3>
        <ul>
          <li>Beet-Details anzeigen</li>
          <li>Pflanzen hinzufügen</li>
          <li>Notizen oder Tipps einblenden</li>
          <li>Später mit Backend verbinden</li>
        </ul>
      </div>
    </div>
  )
}

export default GardenDetailPage
