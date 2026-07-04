function SecondDetailPage({ onBack }) {
  return (
    <div className="detail-page">
      <button type="button" className="back-button" onClick={onBack}>
        ← Zurück zum Gartenplan
      </button>

      <h2>Zweite Detailseite</h2>
      <p>
        Dieses Feld verweist auf eine separate Seite.
      </p>

      <div className="detail-card">
        <h3>Hier kannst du später ergänzen</h3>
        <ul>
          <li>eine zweite Beeteinheit beschreiben</li>
          <li>weitere Pflanzinfos anzeigen</li>
          <li>eigene Daten oder Notizen speichern</li>
        </ul>
      </div>
    </div>
  )
}

export default SecondDetailPage
