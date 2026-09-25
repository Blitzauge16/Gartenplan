import { Navigate, useNavigate, useParams } from 'react-router-dom'
import hotspotMeta, { resolveHotspotId } from '../data/hotspotMeta'
import AreaEditor from './AreaEditor'

export default function DetailPage() {
  const { hotspotId } = useParams()
  const navigate = useNavigate()
  const meta = hotspotMeta[hotspotId]

  // Teilflächen-URLs (z. B. /bereich/haus_tuer) auf den Hauptbereich umleiten,
  // damit es pro Bereich genau eine URL und einen Datenbestand gibt
  const hauptbereich = resolveHotspotId(hotspotId)
  if (meta && hauptbereich !== hotspotId) {
    return <Navigate to={`/bereich/${hauptbereich}`} replace />
  }

  if (!meta) {
    return (
      <div className="detail-page">
        <div className="detail-header">
          <h2>Bereich nicht gefunden</h2>
          <button type="button" className="back-button" onClick={() => navigate('/')}>
            ← Zurück zum Plan
          </button>
        </div>
        <div className="detail-card">
          <p>Für „{hotspotId}“ gibt es keinen Eintrag in hotspotMeta.js.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <div className="detail-header">
        <h2>{meta.title}</h2>
        <button type="button" className="back-button" onClick={() => navigate('/')}>
          ← Zurück zum Plan
        </button>
      </div>

      {meta.description && (
        <div className="detail-card">
          <p>{meta.description}</p>
        </div>
      )}

      <AreaEditor bereich={hotspotId} />
    </div>
  )
}
