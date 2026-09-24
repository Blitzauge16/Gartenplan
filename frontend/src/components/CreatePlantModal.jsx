import { useState } from 'react'
import { api } from '../api'

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
  const [form, setForm] = useState({
    name: '',
    lateinischer_name: '',
    herkunft: '',
    benoetigtes_licht: '',
    bluehzeit: '',
    notizen: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    setError(null)
    try {
      const neu = await api.createGewaechs(form)
      setForm({
        name: '',
        lateinischer_name: '',
        herkunft: '',
        benoetigtes_licht: '',
        bluehzeit: '',
        notizen: '',
      })
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
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                onChange={(e) => setForm({ ...form, lateinischer_name: e.target.value })}
                placeholder="z. B. Lavandula angustifolia"
              />
            </div>

            <div className="form-row-group">
              <div className="form-row">
                <label htmlFor="plant-herkunft">Herkunft</label>
                <input
                  id="plant-herkunft"
                  value={form.herkunft}
                  onChange={(e) => setForm({ ...form, herkunft: e.target.value })}
                  placeholder="z. B. Mittelmeerraum"
                />
              </div>

              <div className="form-row">
                <label htmlFor="plant-licht">Benötigtes Licht</label>
                <select
                  id="plant-licht"
                  value={form.benoetigtes_licht}
                  onChange={(e) => setForm({ ...form, benoetigtes_licht: e.target.value })}
                >
                  <option value="">– auswählen –</option>
                  <option value="vollsonnig">Vollsonnig</option>
                  <option value="sonnig">Sonnig</option>
                  <option value="halbschattig">Halbschattig</option>
                  <option value="schattig">Schattig</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="plant-bluehzeit">Blühzeit</label>
              <input
                id="plant-bluehzeit"
                value={form.bluehzeit}
                onChange={(e) => setForm({ ...form, bluehzeit: e.target.value })}
                placeholder="z. B. Juni–August"
              />
            </div>

            <div className="form-row">
              <label htmlFor="plant-notizen">Notizen</label>
              <textarea
                id="plant-notizen"
                value={form.notizen}
                onChange={(e) => setForm({ ...form, notizen: e.target.value })}
                placeholder="Besondere Pflegehinweise, etc."
                rows={3}
              />
            </div>
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
