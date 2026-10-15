import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'

// Kantenlänge des gespeicherten Icons in Pixeln
const ICON_SIZE = 256
// Maximale Anzeigegröße des Bildes im Fenster
const MAX_W = 560
const MAX_H = 420

// Fenster zum Zuschneiden eines hochgeladenen Bildes zu einem runden Icon.
// Das Bild wird angezeigt, darüber liegt ein verschiebbarer Kreis (Größe per
// Regler). "Speichern" schneidet den Kreisbereich aus, lädt ihn als PNG ins
// Backend hoch und ruft onSaved(icon) auf. "Abbrechen" verwirft alles.
export default function IconCropModal({ file, onSaved, onCancel }) {
  const [imgUrl, setImgUrl] = useState(null) // Data-URL der gewählten Datei
  const [natural, setNatural] = useState(null) // { width, height }
  const [circle, setCircle] = useState(null) // { cx, cy, r } in Anzeige-Pixeln
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const imgRef = useRef(null)
  const dragRef = useRef(null) // { dx, dy } Abstand Maus -> Kreismitte

  // Datei als Data-URL einlesen. Bewusst kein URL.createObjectURL: dessen
  // Freigabe im Effekt-Cleanup kollidiert mit Reacts doppeltem Effekt-Lauf im
  // StrictMode und das Bild würde nie geladen.
  useEffect(() => {
    let cancelled = false
    const reader = new FileReader()
    reader.onload = () => {
      if (!cancelled) setImgUrl(reader.result)
    }
    reader.onerror = () => {
      if (!cancelled) setError('Die Datei konnte nicht gelesen werden.')
    }
    reader.readAsDataURL(file)
    return () => {
      cancelled = true
      reader.abort()
    }
  }, [file])

  // Anzeigegröße so wählen, dass das Bild in MAX_W x MAX_H passt
  const display = useMemo(() => {
    if (!natural) return null
    const scale = Math.min(MAX_W / natural.width, MAX_H / natural.height, 1)
    return { width: natural.width * scale, height: natural.height * scale, scale }
  }, [natural])

  const handleImageLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.target
    setNatural({ width: w, height: h })
    const scale = Math.min(MAX_W / w, MAX_H / h, 1)
    const dw = w * scale
    const dh = h * scale
    // Startkreis: mittig, 60 % der kleineren Seite
    setCircle({ cx: dw / 2, cy: dh / 2, r: (Math.min(dw, dh) * 0.6) / 2 })
  }

  const clampCircle = (c) => {
    if (!display) return c
    const r = Math.max(16, Math.min(c.r, Math.min(display.width, display.height) / 2))
    return {
      r,
      cx: Math.min(Math.max(c.cx, r), display.width - r),
      cy: Math.min(Math.max(c.cy, r), display.height - r),
    }
  }

  const toLocal = (e) => {
    const rect = imgRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrag = (e) => {
    if (!circle) return
    e.preventDefault()
    const { x, y } = toLocal(e)
    // Klick außerhalb des Kreises: Kreis dorthin springen lassen
    const inside = Math.hypot(x - circle.cx, y - circle.cy) <= circle.r
    const next = inside ? circle : clampCircle({ ...circle, cx: x, cy: y })
    if (!inside) setCircle(next)
    dragRef.current = { dx: next.cx - x, dy: next.cy - y }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const moveDrag = (e) => {
    const drag = dragRef.current
    if (!drag) return
    const { x, y } = toLocal(e)
    setCircle((c) => clampCircle({ ...c, cx: x + drag.dx, cy: y + drag.dy }))
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const handleRadius = (e) => {
    setCircle((c) => clampCircle({ ...c, r: Number(e.target.value) }))
  }

  // Kreisbereich auf ein quadratisches Canvas zeichnen, rund maskieren, hochladen
  const handleSave = async () => {
    if (!circle || !display || saving) return
    setSaving(true)
    setError(null)
    try {
      const s = 1 / display.scale // Anzeige-Pixel -> Original-Pixel
      const sx = (circle.cx - circle.r) * s
      const sy = (circle.cy - circle.r) * s
      const sSize = circle.r * 2 * s

      const canvas = document.createElement('canvas')
      canvas.width = ICON_SIZE
      canvas.height = ICON_SIZE
      const ctx = canvas.getContext('2d')
      ctx.beginPath()
      ctx.arc(ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(imgRef.current, sx, sy, sSize, sSize, 0, 0, ICON_SIZE, ICON_SIZE)

      const data = canvas.toDataURL('image/png')
      const icon = await api.createIcon({ data })
      onSaved?.(icon)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const maxRadius = display ? Math.min(display.width, display.height) / 2 : 100

  return (
    <div className="modal-backdrop icon-crop-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-content icon-crop-modal">
        <div className="modal-header">
          <h2>Icon zuschneiden</h2>
          <button type="button" className="modal-close" onClick={onCancel}>
            &times;
          </button>
        </div>

        {error && <div className="editor-error">{error}</div>}

        <div className="modal-body">
          <p className="editor-hint icon-crop-hint">
            Kreis mit der Maus verschieben. Der Bereich im Kreis wird als Icon gespeichert.
          </p>

          <div className="icon-crop-stage">
            {!imgUrl && !error && <p className="icon-crop-loading">Bild wird geladen…</p>}
            {imgUrl && (
              <div
                className="icon-crop-canvas"
                style={display ? { width: display.width, height: display.height } : undefined}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <img
                  ref={imgRef}
                  src={imgUrl}
                  alt=""
                  draggable={false}
                  onLoad={handleImageLoad}
                  onError={() => setError('Das Bild konnte nicht angezeigt werden. Ist es ein gültiges Bildformat?')}
                  style={display ? { width: display.width, height: display.height } : { visibility: 'hidden' }}
                />
                {circle && display && (
                  <svg
                    className="icon-crop-overlay"
                    width={display.width}
                    height={display.height}
                    viewBox={`0 0 ${display.width} ${display.height}`}
                  >
                    <defs>
                      <mask id="icon-crop-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <circle cx={circle.cx} cy={circle.cy} r={circle.r} fill="black" />
                      </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#icon-crop-mask)" />
                    <circle
                      cx={circle.cx}
                      cy={circle.cy}
                      r={circle.r}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                  </svg>
                )}
              </div>
            )}
          </div>

          {circle && (
            <div className="form-row icon-crop-size">
              <label htmlFor="icon-crop-radius">Größe des Ausschnitts</label>
              <input
                id="icon-crop-radius"
                type="range"
                min={16}
                max={Math.floor(maxRadius)}
                value={Math.round(circle.r)}
                onChange={handleRadius}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="editor-button editor-button-secondary" onClick={onCancel} disabled={saving}>
            Abbrechen
          </button>
          <button type="button" className="editor-button" onClick={handleSave} disabled={saving || !circle}>
            {saving ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
