import { useEffect, useRef, useState } from 'react'
import { api, assetUrl } from '../api'
import IconCropModal from './IconCropModal'

// Auswahl des Marker-Icons für eine Pflanze oder ein Objekt: zeigt alle
// gespeicherten Icons als Kacheln (plus "Standard") und bietet einen
// Upload-Button, der den Datei-Explorer öffnet und das gewählte Bild zum
// Zuschneiden anzeigt. Nicht mehr verwendete Icons lassen sich löschen.
//
//   <IconPicker value={form.icon_id} onChange={(id) => setForm({ ...form, icon_id: id })} />
//   defaultIcon: Emoji für "kein Icon" (🌱 für Pflanzen, 📦 für Objekte)
export default function IconPicker({ value, onChange, defaultIcon = '🌱' }) {
  const [icons, setIcons] = useState([])
  const [error, setError] = useState(null)
  const [cropFile, setCropFile] = useState(null)
  const fileInputRef = useRef(null)

  // Erhöhen löst ein erneutes Laden der Icons aus
  const [reloadKey, setReloadKey] = useState(0)
  const loadIcons = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    let active = true
    api
      .getIcons()
      .then((data) => {
        if (!active) return
        setIcons(data)
        setError(null)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

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

  const handleDelete = async (e, icon) => {
    e.stopPropagation()
    try {
      await api.deleteIcon(icon.id)
      if (selectedId === icon.id) onChange?.(null)
      await loadIcons()
    } catch (err) {
      setError(err.message)
    }
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
          <span className="icon-tile-default">{defaultIcon}</span>
          <span className="icon-tile-label">Standard</span>
        </button>
        {icons.map((icon) => {
          const datum = new Date(icon.erstellt_am).toLocaleDateString('de-DE')
          const unused = icon.verwendungen === 0 && selectedId !== icon.id
          return (
            <button
              key={icon.id}
              type="button"
              className={`icon-tile ${selectedId === icon.id ? 'icon-tile-selected' : ''}`}
              onClick={() => onChange?.(icon.id)}
              title={`Hochgeladen am ${datum}`}
            >
              <img src={assetUrl(icon.url)} alt="" className="icon-tile-img" />
              <span className="icon-tile-label">{datum}</span>
              {unused && (
                <span
                  role="button"
                  className="icon-tile-delete"
                  title="Icon löschen (wird nirgends verwendet)"
                  onClick={(e) => handleDelete(e, icon)}
                >
                  &times;
                </span>
              )}
            </button>
          )
        })}
      </div>

      {cropFile && (
        <IconCropModal file={cropFile} onSaved={handleSaved} onCancel={() => setCropFile(null)} />
      )}
    </div>
  )
}
