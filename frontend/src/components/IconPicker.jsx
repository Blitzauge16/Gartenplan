import { useEffect, useRef, useState } from 'react'
import { api, assetUrl } from '../api'
import IconCropModal from './IconCropModal'

// Auswahl des Marker-Icons für eine Pflanze: zeigt alle gespeicherten Icons
// als Kacheln (plus "Standard" = 🌱) und bietet einen Upload-Button, der den
// Datei-Explorer öffnet und das gewählte Bild zum Zuschneiden anzeigt.
//
//   <IconPicker value={form.icon_id} onChange={(id) => setForm({ ...form, icon_id: id })} />
export default function IconPicker({ value, onChange }) {
  const [icons, setIcons] = useState([])
  const [error, setError] = useState(null)
  const [cropFile, setCropFile] = useState(null)
  const fileInputRef = useRef(null)

  const loadIcons = async () => {
    try {
      setIcons(await api.getIcons())
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadIcons()
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    // Zurücksetzen, damit dieselbe Datei erneut gewählt werden kann
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Bitte eine Bilddatei auswählen.')
      return
    }
    setError(null)
    setCropFile(file)
  }

  const handleSaved = async (icon) => {
    setCropFile(null)
    await loadIcons()
    onChange?.(icon.id)
  }

  const selectedId = value === '' || value === undefined ? null : value

  return (
    <div className="icon-picker">
      <div className="icon-picker-header">
        <label>Icon</label>
        <button
          type="button"
          className="editor-button editor-button-secondary icon-picker-upload"
          onClick={() => fileInputRef.current?.click()}
        >
          Bild hochladen…
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {error && <div className="editor-error">{error}</div>}

      <div className="icon-grid">
        <button
          type="button"
          className={`icon-tile ${selectedId === null ? 'icon-tile-selected' : ''}`}
          onClick={() => onChange?.(null)}
          title="Standard-Icon"
        >
          <span className="icon-tile-default">🌱</span>
          <span className="icon-tile-label">Standard</span>
        </button>
        {icons.map((icon) => (
          <button
            key={icon.id}
            type="button"
            className={`icon-tile ${selectedId === icon.id ? 'icon-tile-selected' : ''}`}
            onClick={() => onChange?.(icon.id)}
            title={icon.name}
          >
            <img src={assetUrl(icon.url)} alt={icon.name} className="icon-tile-img" />
            <span className="icon-tile-label">{icon.name}</span>
          </button>
        ))}
      </div>

      {cropFile && (
        <IconCropModal file={cropFile} onSaved={handleSaved} onCancel={() => setCropFile(null)} />
      )}
    </div>
  )
}
