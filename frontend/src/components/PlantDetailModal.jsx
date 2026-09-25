import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import hotspotMeta from '../data/hotspotMeta'

const FIELDS = ['name', 'lateinischer_name', 'herkunft', 'benoetigtes_licht', 'bluehzeit', 'notizen']

function toForm(gewaechs) {
  return Object.fromEntries(FIELDS.map((f) => [f, gewaechs[f] ?? '']))
}

// Gruppiert Pflanzungen nach Bereich; bei mehreren im selben Bereich wird durchnummeriert
function buildStandorte(pflanzungen) {
  const countPerBereich = {}
  for (const p of pflanzungen) {
    countPerBereich[p.ort.bereich] = (countPerBereich[p.ort.bereich] ?? 0) + 1
  }
  const seen = {}
  return pflanzungen.map((p) => {
    const bereich = p.ort.bereich
    const title = hotspotMeta[bereich]?.title ?? bereich ?? 'Unbekannter Bereich'
    seen[bereich] = (seen[bereich] ?? 0) + 1
    return {
      id: p.id,
      bereich,
      label: countPerBereich[bereich] > 1 ? `${title} ${seen[bereich]}` : title,
      datum: p.datum,
    }
  })
}

// Popup mit allen Daten einer Pflanze: links bearbeitbares Formular,
// rechts alle Bereiche, in denen sie steht.
export default function PlantDetailModal({ gewaechs, onClose, onSaved, onDeleted }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => toForm(gewaechs))
  const [pflanzungen, setPflanzungen] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    api.getPflanzungenForGewaechs(gewaechs.id).then(setPflanzungen).catch((err) => setError(err.message))
  }, [gewaechs.id])

  const standorte = buildStandorte(pflanzungen)
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSave = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const updated = await api.updateGewaechs(gewaechs.id, form)
      onSaved?.(updated)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => {
    if (pflanzungen.length > 0) {
      setConfirmDelete(true)
      return
    }
    doDelete()
  }

  const doDelete = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.deleteGewaechs(gewaechs.id)
      onDeleted?.(gewaechs)
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const goToBereich = (bereich) => {
    onClose()
    navigate(`/bereich/${bereich}`)
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content plant-detail">
        <div className="modal-header">
          <button type="button" className="back-button" onClick={onClose}>
            ← Zurück
          </button>
          <h2>{gewaechs.name}</h2>
        </div>

        {error && <div className="editor-error">{error}</div>}

        <form onSubmit={handleSave}>
          <div className="modal-body plant-detail-body">
            <div className="plant-detail-form">
              <div className="form-row">
                <label htmlFor="edit-name">Name *</label>
                <input id="edit-name" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-row">
                <label htmlFor="edit-lat">Lateinischer Name</label>
                <input id="edit-lat" value={form.lateinischer_name} onChange={set('lateinischer_name')} />
              </div>
              <div className="form-row-group">
                <div className="form-row">
                  <label htmlFor="edit-herkunft">Herkunft</label>
                  <input id="edit-herkunft" value={form.herkunft} onChange={set('herkunft')} />
                </div>
                <div className="form-row">
                  <label htmlFor="edit-licht">Benötigtes Licht</label>
                  <select id="edit-licht" value={form.benoetigtes_licht} onChange={set('benoetigtes_licht')}>
                    <option value="">– auswählen –</option>
                    <option value="vollsonnig">Vollsonnig</option>
                    <option value="sonnig">Sonnig</option>
                    <option value="halbschattig">Halbschattig</option>
                    <option value="schattig">Schattig</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="edit-bluehzeit">Blühzeit</label>
                <input id="edit-bluehzeit" value={form.bluehzeit} onChange={set('bluehzeit')} />
              </div>
              <div className="form-row">
                <label htmlFor="edit-notizen">Notizen</label>
                <textarea id="edit-notizen" value={form.notizen} onChange={set('notizen')} rows={4} />
              </div>
            </div>

            <div className="plant-detail-standorte">
              <h3>Standorte ({standorte.length})</h3>
              {standorte.length === 0 ? (
                <p className="editor-hint">Diese Pflanze ist noch nirgends gepflanzt.</p>
              ) : (
                <ul className="standort-list">
                  {standorte.map((s) => (
                    <li key={s.id}>
                      <button type="button" className="standort-link" onClick={() => goToBereich(s.bereich)}>
                        <span>{s.label}</span>
                        {s.datum && (
                          <span className="standort-datum">
                            {new Date(s.datum).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="modal-footer plant-detail-footer">
            <button
              type="button"
              className="editor-button editor-button-danger"
              onClick={handleDeleteClick}
              disabled={saving}
            >
              Pflanze löschen
            </button>
            <div className="plant-detail-footer-right">
              <button type="button" className="editor-button editor-button-secondary" onClick={onClose}>
                Abbrechen
              </button>
              <button type="submit" className="editor-button" disabled={saving}>
                {saving ? 'Speichert...' : 'Speichern'}
              </button>
            </div>
          </div>
        </form>

        {confirmDelete && (
          <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(false)}>
            <div className="modal-content confirm-dialog">
              <div className="modal-header">
                <h2>Wirklich löschen?</h2>
              </div>
              <div className="modal-body">
                <p>
                  <strong>{gewaechs.name}</strong> steht noch an {standorte.length}{' '}
                  {standorte.length === 1 ? 'Standort' : 'Standorten'}. Diese Pflanzungen werden
                  ebenfalls gelöscht:
                </p>
                <ul className="confirm-list">
                  {standorte.map((s) => (
                    <li key={s.id}>{s.label}</li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="editor-button editor-button-secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="editor-button editor-button-danger"
                  onClick={doDelete}
                  disabled={saving}
                >
                  {saving ? 'Löscht...' : 'Endgültig löschen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
