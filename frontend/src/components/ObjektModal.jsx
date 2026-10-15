import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { buildStandorte } from '../utils/standorte'
import IconPicker from './IconPicker'
import StandortListe from './StandortListe'
import ConfirmDeleteDialog from './ConfirmDeleteDialog'

const EMPTY_FORM = { name: '', notizen: '', icon_id: null }

// Modal zum Anlegen (objekt = null) oder Bearbeiten eines Objekts
// (Gegenstand wie Bank, Regentonne, Kompost). Beim Bearbeiten werden rechts
// die Bereiche gezeigt, in denen das Objekt steht.
//
//   <ObjektModal objekt={null} onClose={…} onSaved={(obj) => …} />
//   <ObjektModal objekt={obj} onClose={…} onSaved={…} onDeleted={…} />
export default function ObjektModal({ objekt, onClose, onSaved, onDeleted }) {
  const navigate = useNavigate()
  const isEdit = Boolean(objekt)
  const [form, setForm] = useState(() =>
    isEdit ? { name: objekt.name ?? '', notizen: objekt.notizen ?? '', icon_id: objekt.icon_id ?? null } : EMPTY_FORM
  )
  const [platzierungen, setPlatzierungen] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    api
      .getObject(objekt.thing_id)
      .then((o) => setForm({ name: o.name ?? '', notizen: o.notizen ?? '', icon_id: o.icon_id ?? null }))
      .catch((err) => setError(err.message))
    api.getPlatzierungenForThing(objekt.thing_id).then(setPlatzierungen).catch((err) => setError(err.message))
  }, [isEdit, objekt?.thing_id])

  const standorte = buildStandorte(platzierungen)
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const saved = isEdit
        ? await api.updateObject(objekt.thing_id, form)
        : await api.createObject(form)
      onSaved?.(saved)
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
      await api.deleteObject(objekt.thing_id)
      onDeleted?.(objekt)
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
      <div className={`modal-content ${isEdit ? 'plant-detail' : ''}`}>
        <div className="modal-header">
          {isEdit ? (
            <>
              <button type="button" className="back-button" onClick={onClose}>
                ← Zurück
              </button>
              <h2>{objekt.name}</h2>
            </>
          ) : (
            <>
              <h2>Neues Objekt anlegen</h2>
              <button type="button" className="modal-close" onClick={onClose}>
                &times;
              </button>
            </>
          )}
        </div>

        {error && <div className="editor-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={`modal-body ${isEdit ? 'plant-detail-body' : ''}`}>
            <div className={isEdit ? 'plant-detail-form' : ''}>
              <div className="form-row">
                <label htmlFor="objekt-name">Name *</label>
                <input
                  id="objekt-name"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="z. B. Gartenbank, Regentonne"
                  required
                  autoFocus={!isEdit}
                />
              </div>
              <div className="form-row">
                <label htmlFor="objekt-notizen">Notizen</label>
                <textarea
                  id="objekt-notizen"
                  value={form.notizen}
                  onChange={set('notizen')}
                  placeholder="z. B. Material, Maße, Zustand"
                  rows={4}
                />
              </div>
              <IconPicker
                value={form.icon_id}
                onChange={(icon_id) => setForm((f) => ({ ...f, icon_id }))}
                defaultIcon="📦"
              />
            </div>

            {isEdit && (
              <StandortListe
                standorte={standorte}
                onSelect={goToBereich}
                leerText="Dieses Objekt steht noch nirgends im Plan."
              />
            )}
          </div>

          <div className={`modal-footer ${isEdit ? 'plant-detail-footer' : ''}`}>
            {isEdit && (
              <button
                type="button"
                className="editor-button editor-button-danger"
                onClick={handleDeleteClick}
                disabled={saving}
              >
                Objekt löschen
              </button>
            )}
            <div className="plant-detail-footer-right">
              <button type="button" className="editor-button editor-button-secondary" onClick={onClose}>
                Abbrechen
              </button>
              <button type="submit" className="editor-button" disabled={saving}>
                {saving ? 'Speichert...' : isEdit ? 'Speichern' : 'Objekt anlegen'}
              </button>
            </div>
          </div>
        </form>

        {confirmDelete && (
          <ConfirmDeleteDialog
            name={objekt.name}
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
