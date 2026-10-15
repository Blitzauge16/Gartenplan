import { useEffect, useMemo, useRef, useState } from 'react'
import { extractArea } from '../utils/svgArea'
import { labelsForBereich } from '../data/hotspotMeta'
import { api, assetUrl } from '../api'
import { formatDatum } from '../utils/standorte'
import CreatePlantModal from './CreatePlantModal'
import PlantDetailModal from './PlantDetailModal'
import ObjektModal from './ObjektModal'

// Reiter in der Seitenleiste: welche Art von thing wird gerade platziert?
const TABS = [
  { key: 'gewaechs', label: 'Pflanzen', icon: '🌱' },
  { key: 'objekt', label: 'Objekte', icon: '📦' },
]

const DEFAULT_ICON = { gewaechs: '🌱', objekt: '📦' }
const MARKER_STROKE = { gewaechs: '#166534', objekt: '#92400e' }

// Kleinste Kantenlänge einer Form relativ zur Arealgröße
const MIN_SHAPE_FRACTION = 0.03

const today = () => new Date().toISOString().slice(0, 10)

// Editor für ein Areal: zeigt die Form des Bereichs (aus der Master-SVG) und
// erlaubt, Pflanzen und Objekte per Drag & Drop zu platzieren, Rechteck-Formen
// einzufügen und alle Marker zu verschieben bzw. Formen zu skalieren.
// Positionen werden in Plan-Koordinaten im Backend gespeichert (Tabelle ort),
// die Verknüpfung thing<->Ort in der Tabelle platziert.
export default function AreaEditor({ bereich }) {
  const [platzierungen, setPlatzierungen] = useState([])
  const [gewaechse, setGewaechse] = useState([])
  const [objekte, setObjekte] = useState([])
  const [tab, setTab] = useState('gewaechs')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [modal, setModal] = useState(null) // null | 'neuePflanze' | 'neuesObjekt' | 'detail'
  const [apiError, setApiError] = useState(null)
  const [saving, setSaving] = useState(false)
  // Drag eines neuen things aus der Liste: Position für das Geist-Icon
  const [newDrag, setNewDrag] = useState(null) // { thing, art, x, y, overCanvas }

  const svgRef = useRef(null)
  const dragRef = useRef(null) // { platzierungId, ortId, moved, x, y }
  const resizeRef = useRef(null) // { platzierungId, thingId, cx, cy, width, height, notizen }

  // Ein Bereich kann mehrere Teilflächen umfassen (z. B. haus + haus_varanda + haus_tuer)
  const area = useMemo(() => extractArea(labelsForBereich(bereich)), [bereich])

  // Erhöhen löst ein erneutes Laden der Daten aus
  const [reloadKey, setReloadKey] = useState(0)
  const loadData = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    let active = true
    Promise.all([
      api.getPlatzierungenForBereich(bereich),
      api.getGewaechse(),
      api.getObjects(),
    ])
      .then(([pl, gw, ob]) => {
        if (!active) return
        setPlatzierungen(pl)
        setGewaechse(gw)
        setObjekte(ob)
        setApiError(null)
      })
      .catch((err) => {
        if (active) setApiError(err.message)
      })
    return () => {
      active = false
    }
  }, [bereich, reloadKey])

  // Marker-Größe relativ zur Arealgröße, damit sie in jedem Bereich passt
  const markerRadius = useMemo(() => {
    if (!area) return 1
    return Math.max(area.viewBox.width, area.viewBox.height) * 0.035
  }, [area])

  const minShapeSize = area ? Math.max(area.viewBox.width, area.viewBox.height) * MIN_SHAPE_FRACTION : 1

  // Mausposition -> Plan-Koordinaten (dasselbe System wie im Backend)
  const toPlanCoords = (event) => {
    const point = new DOMPoint(event.clientX, event.clientY)
    return point.matrixTransform(svgRef.current.getScreenCTM().inverse())
  }

  // Prüft, ob ein Bildschirmpunkt innerhalb des SVG-Canvas liegt
  const isOverCanvas = (clientX, clientY) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return false
    return (
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    )
  }

  // thing an Plan-Koordinaten platzieren (Ort + Platzierung in einem Schritt)
  const placeThing = async (thing, planX, planY) => {
    if (saving) return
    setSaving(true)
    try {
      const neu = await api.createPlatzierung({
        thing_id: thing.thing_id,
        x_koordinate: planX,
        y_koordinate: planY,
        bereich,
        datum: today(),
      })
      await loadData()
      setSelectedId(neu.id)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Neue Rechteck-Form in der Mitte des Areals einfügen
  const addShape = async () => {
    if (saving || !area) return
    setSaving(true)
    try {
      const { x, y, width, height } = area.viewBox
      const shape = await api.createShape({ width: width * 0.2, height: height * 0.2 })
      const neu = await api.createPlatzierung({
        thing_id: shape.thing_id,
        x_koordinate: x + width / 2,
        y_koordinate: y + height / 2,
        bereich,
        datum: today(),
      })
      await loadData()
      setSelectedId(neu.id)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Drag aus der Liste starten: Geist-Icon folgt der Maus,
  // beim Loslassen über der Fläche wird platziert.
  const startNewDrag = (event, thing, art) => {
    event.preventDefault()
    setNewDrag({ thing, art, x: event.clientX, y: event.clientY, overCanvas: false })

    const onMove = (e) => {
      setNewDrag({
        thing,
        art,
        x: e.clientX,
        y: e.clientY,
        overCanvas: isOverCanvas(e.clientX, e.clientY),
      })
    }
    const onUp = (e) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      setNewDrag(null)
      if (e.type === 'pointerup' && isOverCanvas(e.clientX, e.clientY)) {
        const { x, y } = toPlanCoords(e)
        placeThing(thing, x, y)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  // Vorhandenen Marker (oder eine Form) verschieben
  const startDrag = (event, p) => {
    event.stopPropagation()
    dragRef.current = {
      platzierungId: p.id,
      ortId: p.ort.id,
      moved: false,
      x: p.ort.x_koordinate,
      y: p.ort.y_koordinate,
    }
    svgRef.current.setPointerCapture?.(event.pointerId)
  }

  // Form über den Griff unten rechts skalieren (Ort bleibt Mittelpunkt)
  const startResize = (event, p) => {
    event.stopPropagation()
    resizeRef.current = {
      platzierungId: p.id,
      thingId: p.thing.thing_id,
      cx: p.ort.x_koordinate,
      cy: p.ort.y_koordinate,
      width: p.thing.width,
      height: p.thing.height,
      notizen: p.thing.notizen,
    }
    setSelectedId(p.id)
    svgRef.current.setPointerCapture?.(event.pointerId)
  }

  const updateLocal = (platzierungId, fn) =>
    setPlatzierungen((list) => list.map((p) => (p.id === platzierungId ? fn(p) : p)))

  const handlePointerMove = (event) => {
    const resize = resizeRef.current
    if (resize) {
      const { x, y } = toPlanCoords(event)
      resize.width = Math.max(minShapeSize, 2 * (x - resize.cx))
      resize.height = Math.max(minShapeSize, 2 * (y - resize.cy))
      updateLocal(resize.platzierungId, (p) => ({
        ...p,
        thing: { ...p.thing, width: resize.width, height: resize.height },
      }))
      return
    }
    const drag = dragRef.current
    if (!drag) return
    const { x, y } = toPlanCoords(event)
    drag.moved = true
    drag.x = x
    drag.y = y
    updateLocal(drag.platzierungId, (p) => ({
      ...p,
      ort: { ...p.ort, x_koordinate: x, y_koordinate: y },
    }))
  }

  const handlePointerUp = async () => {
    const resize = resizeRef.current
    resizeRef.current = null
    if (resize) {
      try {
        await api.updateShape(resize.thingId, {
          width: resize.width,
          height: resize.height,
          notizen: resize.notizen,
        })
      } catch (err) {
        setApiError(err.message)
        loadData()
      }
      return
    }

    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    if (!drag.moved) {
      // Kein Ziehen -> als Auswahl behandeln
      setSelectedId((id) => (id === drag.platzierungId ? null : drag.platzierungId))
      return
    }
    try {
      await api.updateOrt(drag.ortId, { x_koordinate: drag.x, y_koordinate: drag.y, bereich })
    } catch (err) {
      setApiError(err.message)
      loadData() // Position zurücksetzen, wenn das Speichern fehlschlug
    }
  }

  const handleCreated = async (neu, art) => {
    await loadData()
    // Reiter und Suchfeld auf das neue thing setzen, damit es sofort oben in der Liste steht
    setTab(art)
    setSearch(neu.name)
  }

  // Liste des aktiven Reiters, gefiltert nach Suchbegriff
  const listItems = useMemo(() => {
    const source = tab === 'gewaechs' ? gewaechse : objekte
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.lateinischer_name?.toLowerCase().includes(q) ||
        t.typ?.toLowerCase().includes(q)
    )
  }, [tab, gewaechse, objekte, search])

  const handleDeletePlatzierung = async (p) => {
    try {
      if (p.thing.art === 'shape') {
        // Eine Form existiert nur an ihrem Platz: Form samt Platzierung löschen
        await api.deleteShape(p.thing.thing_id)
      } else {
        await api.deletePlatzierung(p.id)
      }
      setSelectedId(null)
      await loadData()
    } catch (err) {
      setApiError(err.message)
    }
  }

  if (!area) {
    return (
      <div className="editor-error">
        Für diesen Bereich wurde keine Fläche in der SVG gefunden.
      </div>
    )
  }

  const selected = platzierungen.find((p) => p.id === selectedId)
  const { x, y, width, height } = area.viewBox
  // Formen zuerst zeichnen, damit Marker darüber liegen
  const ordered = [...platzierungen].sort(
    (a, b) => (a.thing.art === 'shape' ? 0 : 1) - (b.thing.art === 'shape' ? 0 : 1)
  )
  const handleSize = markerRadius * 0.5

  return (
    <div className="area-editor">
      <div className={`area-canvas ${newDrag?.overCanvas ? 'area-canvas-droptarget' : ''}`}>
        <svg
          ref={svgRef}
          viewBox={`${x} ${y} ${width} ${height}`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <g className="area-shape" dangerouslySetInnerHTML={{ __html: area.shapeMarkup }} />
          <defs>
            {/* Runde Maske für Marker mit eigenem Icon-Bild */}
            <clipPath id={`marker-clip-${bereich}`}>
              <circle r={markerRadius * 0.88} />
            </clipPath>
          </defs>

          {ordered.map((p) => {
            const isSelected = p.id === selectedId
            const cx = p.ort.x_koordinate
            const cy = p.ort.y_koordinate

            if (p.thing.art === 'shape') {
              const w = p.thing.width
              const h = p.thing.height
              return (
                <g
                  key={p.id}
                  className={`shape-marker ${isSelected ? 'shape-marker-selected' : ''}`}
                  transform={`translate(${cx} ${cy})`}
                  onPointerDown={(e) => startDrag(e, p)}
                >
                  <rect
                    x={-w / 2}
                    y={-h / 2}
                    width={w}
                    height={h}
                    rx={markerRadius * 0.15}
                    strokeWidth={markerRadius * 0.1}
                    strokeDasharray={isSelected ? undefined : `${markerRadius * 0.3} ${markerRadius * 0.2}`}
                  />
                  {isSelected && (
                    <rect
                      className="shape-resize-handle"
                      x={w / 2 - handleSize / 2}
                      y={h / 2 - handleSize / 2}
                      width={handleSize}
                      height={handleSize}
                      onPointerDown={(e) => startResize(e, p)}
                    />
                  )}
                  <title>{p.thing.notizen || 'Form'}</title>
                </g>
              )
            }

            const art = p.thing.art
            const iconUrl = assetUrl(p.thing.icon_url)
            return (
              <g
                key={p.id}
                className="plant-marker"
                transform={`translate(${cx} ${cy})`}
                onPointerDown={(e) => startDrag(e, p)}
              >
                <circle
                  r={markerRadius}
                  fill={isSelected ? '#4ade80' : '#ffffff'}
                  stroke={MARKER_STROKE[art] ?? '#334155'}
                  strokeWidth={markerRadius * 0.12}
                />
                {iconUrl ? (
                  <image
                    href={iconUrl}
                    x={-markerRadius * 0.88}
                    y={-markerRadius * 0.88}
                    width={markerRadius * 1.76}
                    height={markerRadius * 1.76}
                    clipPath={`url(#marker-clip-${bereich})`}
                    preserveAspectRatio="xMidYMid slice"
                    style={{ pointerEvents: 'none' }}
                  />
                ) : (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={markerRadius * 1.2}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {DEFAULT_ICON[art] ?? '❓'}
                  </text>
                )}
                <title>{p.thing.name}</title>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="area-sidebar">
        {apiError && <div className="editor-error">{apiError}</div>}

        <div className="editor-box">
          <div className="editor-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`editor-tab ${tab === t.key ? 'editor-tab-active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <label htmlFor="thing-search">{tab === 'gewaechs' ? 'Pflanze suchen' : 'Objekt suchen'}</label>
          <input
            id="thing-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'gewaechs' ? 'Name, lateinischer Name oder Typ…' : 'Name…'}
          />
          <ul className="plant-list">
            {listItems.length === 0 && (
              <li className="plant-list-empty">
                {tab === 'gewaechs' ? 'Keine Pflanze gefunden.' : 'Kein Objekt gefunden.'}
              </li>
            )}
            {listItems.map((t) => (
              <li
                key={t.thing_id}
                className={`plant-list-item ${newDrag?.thing.thing_id === t.thing_id ? 'plant-list-item-dragging' : ''}`}
                onPointerDown={(e) => startNewDrag(e, t, tab)}
                title={t.lateinischer_name || t.name}
              >
                {t.icon_url ? (
                  <img className="plant-list-icon plant-list-icon-img" src={assetUrl(t.icon_url)} alt="" />
                ) : (
                  <span className="plant-list-icon">{DEFAULT_ICON[tab]}</span>
                )}
                <span className="plant-list-text">
                  <span className="plant-list-name">{t.name}</span>
                  {(t.lateinischer_name || t.typ) && (
                    <span className="plant-list-latin">{t.lateinischer_name || t.typ}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="editor-hint">
            Eintrag anklicken, festhalten und auf die Fläche ziehen. Marker lassen sich
            anschließend verschieben.
          </p>
          <button
            type="button"
            className="editor-button editor-button-full"
            onClick={() => setModal(tab === 'gewaechs' ? 'neuePflanze' : 'neuesObjekt')}
          >
            {tab === 'gewaechs' ? '+ Neue Pflanze anlegen' : '+ Neues Objekt anlegen'}
          </button>
        </div>

        <div className="editor-box">
          <h3>Formen</h3>
          <p className="editor-hint" style={{ marginTop: 0 }}>
            Rechtecke markieren Flächen, z. B. ein Beet oder einen Weg. Größe über den Griff
            unten rechts ändern.
          </p>
          <button
            type="button"
            className="editor-button editor-button-secondary editor-button-full"
            onClick={addShape}
            disabled={saving}
          >
            ▭ Rechteck hinzufügen
          </button>
        </div>

        {selected && (
          <SelectedPanel
            key={selected.id}
            platzierung={selected}
            onEdit={() => setModal('detail')}
            onDelete={() => handleDeletePlatzierung(selected)}
            onSaved={loadData}
            onError={setApiError}
          />
        )}

        <CreatePlantModal
          isOpen={modal === 'neuePflanze'}
          onClose={() => setModal(null)}
          onCreated={(neu) => handleCreated(neu, 'gewaechs')}
        />

        {modal === 'neuesObjekt' && (
          <ObjektModal
            objekt={null}
            onClose={() => setModal(null)}
            onSaved={(neu) => handleCreated(neu, 'objekt')}
          />
        )}

        {modal === 'detail' && selected?.thing.art === 'gewaechs' && (
          <PlantDetailModal
            gewaechs={selected.thing}
            onClose={() => setModal(null)}
            onSaved={loadData}
            onDeleted={() => {
              setSelectedId(null)
              loadData()
            }}
          />
        )}

        {modal === 'detail' && selected?.thing.art === 'objekt' && (
          <ObjektModal
            objekt={selected.thing}
            onClose={() => setModal(null)}
            onSaved={loadData}
            onDeleted={() => {
              setSelectedId(null)
              loadData()
            }}
          />
        )}
      </div>

      {newDrag && (
        <div
          className={`drag-ghost ${newDrag.overCanvas ? 'drag-ghost-ok' : ''}`}
          style={{ left: newDrag.x, top: newDrag.y }}
        >
          {newDrag.thing.icon_url ? (
            <img className="drag-ghost-icon drag-ghost-icon-img" src={assetUrl(newDrag.thing.icon_url)} alt="" />
          ) : (
            <span className="drag-ghost-icon">{DEFAULT_ICON[newDrag.art]}</span>
          )}
          <span className="drag-ghost-name">{newDrag.thing.name}</span>
        </div>
      )}
    </div>
  )
}

// Seitenleisten-Kasten für die ausgewählte Platzierung: zeigt das thing,
// erlaubt Datum/Notizen der Platzierung (bzw. Maße/Notizen einer Form) zu
// ändern und bietet Bearbeiten/Löschen an.
function SelectedPanel({ platzierung: p, onEdit, onDelete, onSaved, onError }) {
  const isShape = p.thing.art === 'shape'
  const [datum, setDatum] = useState(p.datum ? p.datum.slice(0, 10) : '')
  const [notizen, setNotizen] = useState(isShape ? p.thing.notizen ?? '' : p.notizen ?? '')
  // Maße: null = noch nicht von Hand geändert, dann gilt der Wert aus dem Plan
  // (der sich beim Skalieren per Griff live ändert)
  const [widthInput, setWidthInput] = useState(null)
  const [heightInput, setHeightInput] = useState(null)
  const [saving, setSaving] = useState(false)

  const width = widthInput ?? (isShape ? Math.round(p.thing.width) : 0)
  const height = heightInput ?? (isShape ? Math.round(p.thing.height) : 0)

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (isShape) {
        await api.updateShape(p.thing.thing_id, { width, height, notizen })
        setWidthInput(null)
        setHeightInput(null)
      } else {
        await api.updatePlatzierung(p.id, { datum: datum || null, notizen })
      }
      await onSaved()
    } catch (err) {
      onError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const title = isShape ? 'Rechteck' : p.thing.name
  const subtitle = isShape
    ? null
    : p.thing.art === 'gewaechs'
      ? [p.thing.lateinischer_name, p.thing.typ].filter(Boolean).join(' · ')
      : 'Objekt'

  return (
    <form className="editor-box" onSubmit={handleSave}>
      <h3>{title}</h3>
      {subtitle && <p className="editor-hint" style={{ marginTop: 0 }}>{subtitle}</p>}

      {isShape ? (
        <div className="editor-inline-fields">
          <div>
            <label htmlFor="shape-width">Breite</label>
            <input
              id="shape-width"
              type="number"
              min={1}
              value={width}
              onChange={(e) => setWidthInput(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="shape-height">Höhe</label>
            <input
              id="shape-height"
              type="number"
              min={1}
              value={height}
              onChange={(e) => setHeightInput(Number(e.target.value))}
            />
          </div>
        </div>
      ) : (
        <>
          <label htmlFor="platzierung-datum">
            {p.thing.art === 'gewaechs' ? 'Gepflanzt am' : 'Aufgestellt am'}
          </label>
          <input
            id="platzierung-datum"
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
          />
        </>
      )}

      <label htmlFor="platzierung-notizen">{isShape ? 'Notizen' : 'Notizen zum Standort'}</label>
      <textarea
        id="platzierung-notizen"
        rows={2}
        value={notizen}
        onChange={(e) => setNotizen(e.target.value)}
        placeholder={isShape ? 'z. B. Kräuterbeet' : 'z. B. Setzling vom Markt'}
      />

      {!isShape && p.datum && (
        <p className="editor-hint">Zuletzt gespeichert: {formatDatum(p.datum)}</p>
      )}

      <div className="editor-actions">
        <button type="submit" className="editor-button" disabled={saving}>
          {saving ? 'Speichert…' : 'Speichern'}
        </button>
        {!isShape && (
          <button type="button" className="editor-button editor-button-secondary" onClick={onEdit}>
            {p.thing.art === 'gewaechs' ? 'Pflanze bearbeiten' : 'Objekt bearbeiten'}
          </button>
        )}
        <button type="button" className="editor-button editor-button-danger" onClick={onDelete}>
          {isShape ? 'Rechteck löschen' : 'Platzierung löschen'}
        </button>
      </div>
    </form>
  )
}
