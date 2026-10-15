import { useState } from 'react'
import { api } from '../api'
import IconPicker from './IconPicker'
import TypDatalist from './TypDatalist'
import { LICHT_OPTIONEN } from '../data/options'

const EMPTY_FORM = {
  name: '',
  lateinischer_name: '',
  herkunft: '',
  benoetigtes_licht: '',
  bluehzeit: '',
  typ: '',
  notizen: '',
  icon_id: null,
}

// Wiederverwendbares Modal zum Anlegen einer neuen Pflanze.
// Kann von jeder Seite aus importiert und verwendet werden.
//
// Beispiel:
//   import CreatePlantModal from './CreatePlantModal'
//   const [showModal, setShowModal] = useState(false)
//   <button onClick={() => setShowModal(true)}>Neue Pflanze</button>
//   <CreatePlantModal
//     isOpen={showModal}
//     onClose={() => setShowModal(false)}
//     onCreated={(pflanze) => console.log('Angelegt:', pflanze)}
//   />
export default function CreatePlantModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    setError(null)
    try {
      const neu = await api.createGewaechs(form)
      setForm(EMPTY_FORM)
      onCreated?.(neu)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Neue Pflanze anlegen</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="editor-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <label htmlFor="plant-name">Name *</label>
              <input
                id="plant-name"
                value={form.name}
                onChange={set('name')}
                placeholder="z. B. Lavendel"
                required
                autoFocus
              />
            </div>

            <div className="form-row">
              <label htmlFor="plant-lat">Lateinischer Name</label>
              <input
                id="plant-lat"
                value={form.lateinischer_name}
                onChange={set('lateinischer_name')}
                placeholder="z. B. Lavandula angustifolia"
              />
            </div>

            <div className="form-row-group">
              <div className="form-row">
                <label htmlFor="plant-typ">Typ</label>
                <input
                  id="plant-typ"
                  value={form.typ}
                  onChange={set('typ')}
                  placeholder="z. B. Staude, Gemüse, Strauch"
                  list="plant-typ-vorschlaege"
                />
                <TypDatalist />
              </div>

              <div className="form-row">
                <label htmlFor="plant-herkunft">Herkunft</label>
                <input
                  id="plant-herkunft"
                  value={form.herkunft}
                  onChange={set('herkunft')}
                  placeholder="z. B. Mittelmeerraum"
                />
              </div>
            </div>

            <div className="form-row-group">
              <div className="form-row">
                <label htmlFor="plant-licht">Benötigtes Licht</label>
                <select id="plant-licht" value={form.benoetigtes_licht} onChange={set('benoetigtes_licht')}>
                  <option value="">– auswählen –</option>
                  {LICHT_OPTIONEN.map((l) => (
                    <option key={l} value={l}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="plant-bluehzeit">Blühzeit</label>
                <input
                  id="plant-bluehzeit"
                  value={form.bluehzeit}
                  onChange={set('bluehzeit')}
                  placeholder="z. B. Juni–August"
                />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="plant-notizen">Notizen</label>
              <textarea
                id="plant-notizen"
                value={form.notizen}
                onChange={set('notizen')}
                placeholder="Besondere Pflegehinweise, etc."
                rows={3}
              />
            </div>

            <IconPicker
              value={form.icon_id}
              onChange={(icon_id) => setForm((f) => ({ ...f, icon_id }))}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="editor-button editor-button-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="editor-button" disabled={saving}>
              {saving ? 'Wird angelegt...' : 'Pflanze anlegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
