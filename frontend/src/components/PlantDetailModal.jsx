import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { LICHT_OPTIONEN } from '../data/options'
import { buildStandorte } from '../utils/standorte'
import IconPicker from './IconPicker'
import TypDatalist from './TypDatalist'
import StandortListe from './StandortListe'
import ConfirmDeleteDialog from './ConfirmDeleteDialog'

const FIELDS = ['name', 'lateinischer_name', 'herkunft', 'benoetigtes_licht', 'bluehzeit', 'typ', 'notizen']

function toForm(gewaechs) {
  return {
    ...Object.fromEntries(FIELDS.map((f) => [f, gewaechs[f] ?? ''])),
    icon_id: gewaechs.icon_id ?? null,
  }
}

// Popup mit allen Daten einer Pflanze: links bearbeitbares Formular,
// rechts alle Bereiche, in denen sie steht.
// gewaechs braucht mindestens { thing_id, name }.
export default function PlantDetailModal({ gewaechs, onClose, onSaved, onDeleted }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => toForm(gewaechs))
  const [platzierungen, setPlatzierungen] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    // Vollständige Daten nachladen (im Editor kommt nur ein Auszug mit)
    api.getGewaechs(gewaechs.thing_id).then((g) => setForm(toForm(g))).catch((err) => setError(err.message))
    api.getPlatzierungenForThing(gewaechs.thing_id).then(setPlatzierungen).catch((err) => setError(err.message))
  }, [gewaechs.thing_id])

  const standorte = buildStandorte(platzierungen)
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSave = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const updated = await api.updateGewaechs(gewaechs.thing_id, form)
      onSaved?.(updated)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => {
    if (platzierungen.length > 0) {
      setConfirmDelete(true)
      return
    }
    doDelete()
  }

  const doDelete = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.deleteGewaechs(gewaechs.thing_id)
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
                  <label htmlFor="edit-typ">Typ</label>
                  <input id="edit-typ" value={form.typ} onChange={set('typ')} list="plant-typ-vorschlaege" />
                  <TypDatalist />
                </div>
                <div className="form-row">
                  <label htmlFor="edit-herkunft">Herkunft</label>
                  <input id="edit-herkunft" value={form.herkunft} onChange={set('herkunft')} />
                </div>
              </div>
              <div className="form-row-group">
                <div className="form-row">
                  <label htmlFor="edit-licht">Benötigtes Licht</label>
                  <select id="edit-licht" value={form.benoetigtes_licht} onChange={set('benoetigtes_licht')}>
                    <option value="">– auswählen –</option>
                    {LICHT_OPTIONEN.map((l) => (
                      <option key={l} value={l}>
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label htmlFor="edit-bluehzeit">Blühzeit</label>
                  <input id="edit-bluehzeit" value={form.bluehzeit} onChange={set('bluehzeit')} />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="edit-notizen">Notizen</label>
                <textarea id="edit-notizen" value={form.notizen} onChange={set('notizen')} rows={4} />
              </div>
              <IconPicker
                value={form.icon_id}
                onChange={(icon_id) => setForm((f) => ({ ...f, icon_id }))}
              />
            </div>

            <StandortListe
              standorte={standorte}
              onSelect={goToBereich}
              leerText="Diese Pflanze ist noch nirgends gepflanzt."
            />
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
          <ConfirmDeleteDialog
            name={gewaechs.name}
            standorte={standorte}
            saving={saving}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={doDelete}
          />
        )}
      </div>
    </div>
  )
}
