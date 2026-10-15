import { formatDatum } from '../utils/standorte'

// Liste der Bereiche, in denen ein thing steht. Klick springt in den Bereich.
export default function StandortListe({ standorte, onSelect, leerText }) {
  return (
    <div className="plant-detail-standorte">
      <h3>Standorte ({standorte.length})</h3>
      {standorte.length === 0 ? (
        <p className="editor-hint">{leerText}</p>
      ) : (
        <ul className="standort-list">
          {standorte.map((s) => (
            <li key={s.id}>
              <button type="button" className="standort-link" onClick={() => onSelect(s.bereich)}>
                <span>{s.label}</span>
                {s.datum && <span className="standort-datum">{formatDatum(s.datum)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
