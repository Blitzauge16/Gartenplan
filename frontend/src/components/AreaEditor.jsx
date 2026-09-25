import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { extractArea } from '../utils/svgArea'
import { labelsForBereich } from '../data/hotspotMeta'
import { api } from '../api'
import CreatePlantModal from './CreatePlantModal'
import PlantDetailModal from './PlantDetailModal'

// Editor für ein Areal: zeigt die Form des Bereichs (aus der Master-SVG) und
// erlaubt, Pflanzen aus der Liste per Drag & Drop zu platzieren und
// vorhandene Marker per Drag zu verschieben.
// Positionen werden in Plan-Koordinaten im Backend gespeichert (Tabelle ort),
// die Verknüpfung Pflanze<->Position in der Tabelle gepflanzt.
export default function AreaEditor({ bereich }) {
  const [area, setArea] = useState(null)
  const [pflanzungen, setPflanzungen] = useState([])
  const [gewaechse, setGewaechse] = useState([])
  const [search, setSearch] = useState('')
  const [selectedPflanzungId, setSelectedPflanzungId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [saving, setSaving] = useState(false)
  // Drag einer neuen Pflanze aus der Liste: Position für das Geist-Icon
  const [newDrag, setNewDrag] = useState(null) // { gewaechs, x, y, overCanvas }

  const svgRef = useRef(null)
  const dragRef = useRef(null) // { pflanzungId, ortId, moved, x, y }
  const newDragRef = useRef(null) // gewaechs, das gerade aus der Liste gezogen wird

  useEffect(() => {
    // Ein Bereich kann mehrere Teilflächen umfassen (z. B. haus + haus_varanda + haus_tuer)
    setArea(extractArea(labelsForBereich(bereich)))
  }, [bereich])

  const loadData = useCallback(async () => {
    try {
      const [pf, gw] = await Promise.all([
        api.getPflanzungenForBereich(bereich),
        api.getGewaechse(),
      ])
      setPflanzungen(pf)
      setGewaechse(gw)
      setApiError(null)
    } catch (err) {
      setApiError(err.message)
    }
  }, [bereich])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Marker-Größe relativ zur Arealgröße, damit sie in jedem Bereich passt
  const markerRadius = useMemo(() => {
    if (!area) return 1
    return Math.max(area.viewBox.width, area.viewBox.height) * 0.035
  }, [area])

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

  // Neue Pflanze an Plan-Koordinaten anlegen (Ort + Pflanzung)
  const plantAt = async (gewaechs, planX, planY) => {
    if (saving) return
    setSaving(true)
    try {
      const ort = await api.createOrt({ x_koordinate: planX, y_koordinate: planY, bereich })
      await api.createPflanzung({
        ort_id: ort.id,
        gewaechs_id: gewaechs.id,
        datum: new Date().toISOString().slice(0, 10),
      })
      await loadData()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Drag aus der Pflanzenliste starten: Geist-Icon folgt der Maus,
  // beim Loslassen über der Fläche wird gepflanzt.
  const startNewDrag = (event, gewaechs) => {
    event.preventDefault()
    newDragRef.current = gewaechs
    setNewDrag({ gewaechs, x: event.clientX, y: event.clientY, overCanvas: false })

    const onMove = (e) => {
      setNewDrag({
        gewaechs,
        x: e.clientX,
        y: e.clientY,
        overCanvas: isOverCanvas(e.clientX, e.clientY),
      })
    }
    const onUp = (e) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      newDragRef.current = null
      setNewDrag(null)
      if (e.type === 'pointerup' && isOverCanvas(e.clientX, e.clientY)) {
        const { x, y } = toPlanCoords(e)
        plantAt(gewaechs, x, y)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const startDrag = (event, pflanzung) => {
    event.stopPropagation()
    dragRef.current = {
      pflanzungId: pflanzung.id,
      ortId: pflanzung.ort.id,
      moved: false,
      x: pflanzung.ort.x_koordinate,
      y: pflanzung.ort.y_koordinate,
    }
    svgRef.current.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event) => {
    const drag = dragRef.current
    if (!drag) return
    const { x, y } = toPlanCoords(event)
    drag.moved = true
    drag.x = x
    drag.y = y
    setPflanzungen((list) =>
      list.map((p) =>
        p.id === drag.pflanzungId
          ? { ...p, ort: { ...p.ort, x_koordinate: x, y_koordinate: y } }
          : p
      )
    )
  }

  const handlePointerUp = async () => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    if (!drag.moved) {
      // Kein Ziehen -> als Auswahl behandeln
      setSelectedPflanzungId((id) => (id === drag.pflanzungId ? null : drag.pflanzungId))
      return
    }
    try {
      await api.updateOrt(drag.ortId, { x_koordinate: drag.x, y_koordinate: drag.y, bereich })
    } catch (err) {
      setApiError(err.message)
      loadData() // Position zurücksetzen, wenn das Speichern fehlschlug
    }
  }

  const handlePlantCreated = async (neu) => {
    await loadData()
    // Suchfeld auf die neue Pflanze setzen, damit sie sofort oben in der Liste steht
    setSearch(neu.name)
  }

  const filteredGewaechse = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return gewaechse
    return gewaechse.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) || g.lateinischer_name?.toLowerCase().includes(q)
    )
  }, [gewaechse, search])

  const handleDelete = async (pflanzung) => {
    try {
      // Ort löschen entfernt die Pflanzung gleich mit (ON DELETE CASCADE)
      await api.deleteOrt(pflanzung.ort.id)
      setSelectedPflanzungId(null)
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

  const selectedPflanzung = pflanzungen.find((p) => p.id === selectedPflanzungId)
  const { x, y, width, height } = area.viewBox

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
          {pflanzungen.map((p) => (
            <g
              key={p.id}
              className="plant-marker"
              transform={`translate(${p.ort.x_koordinate} ${p.ort.y_koordinate})`}
              onPointerDown={(e) => startDrag(e, p)}
            >
              <circle
                r={markerRadius}
                fill={p.id === selectedPflanzungId ? '#4ade80' : '#ffffff'}
                stroke="#166534"
                strokeWidth={markerRadius * 0.12}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={markerRadius * 1.2}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                🌱
              </text>
              <title>{p.gewaechs.name}</title>
            </g>
          ))}
        </svg>
      </div>

      <div className="area-sidebar">
        {apiError && <div className="editor-error">{apiError}</div>}

        <div className="editor-box">
          <h3>Pflanze platzieren</h3>
          <label htmlFor="gewaechs-search">Pflanze suchen</label>
          <input
            id="gewaechs-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name oder lateinischer Name…"
          />
          <ul className="plant-list">
            {filteredGewaechse.length === 0 && (
              <li className="plant-list-empty">Keine Pflanze gefunden.</li>
            )}
            {filteredGewaechse.map((g) => (
              <li
                key={g.id}
                className={`plant-list-item ${newDrag?.gewaechs.id === g.id ? 'plant-list-item-dragging' : ''}`}
                onPointerDown={(e) => startNewDrag(e, g)}
                title={g.lateinischer_name || g.name}
              >
                <span className="plant-list-icon">🌱</span>
                <span className="plant-list-text">
                  <span className="plant-list-name">{g.name}</span>
                  {g.lateinischer_name && (
                    <span className="plant-list-latin">{g.lateinischer_name}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="editor-hint">
            Pflanze anklicken, festhalten und auf die Fläche ziehen. Marker lassen sich
            anschließend verschieben.
          </p>
        </div>

        <div className="editor-box">
          <button
            type="button"
            className="editor-button editor-button-full"
            onClick={() => setShowCreateModal(true)}
          >
            + Neue Pflanze anlegen
          </button>
        </div>

        <CreatePlantModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePlantCreated}
        />

        {showDetailModal && selectedPflanzung && (
          <PlantDetailModal
            gewaechs={selectedPflanzung.gewaechs}
            onClose={() => setShowDetailModal(false)}
            onSaved={loadData}
            onDeleted={() => {
              setShowDetailModal(false)
              setSelectedPflanzungId(null)
              loadData()
            }}
          />
        )}

        {selectedPflanzung && (
          <div className="editor-box">
            <h3>{selectedPflanzung.gewaechs.name}</h3>
            {selectedPflanzung.gewaechs.lateinischer_name && (
              <p className="editor-hint">{selectedPflanzung.gewaechs.lateinischer_name}</p>
            )}
            {selectedPflanzung.datum && (
              <p className="editor-hint">
                Gepflanzt am {new Date(selectedPflanzung.datum).toLocaleDateString('de-DE')}
              </p>
            )}
            <button
              type="button"
              className="editor-button"
              onClick={() => setShowDetailModal(true)}
            >
              Bearbeiten
            </button>
            <button
              type="button"
              className="editor-button editor-button-danger"
              onClick={() => handleDelete(selectedPflanzung)}
            >
              Pflanzung löschen
            </button>
          </div>
        )}
      </div>

      {newDrag && (
        <div
          className={`drag-ghost ${newDrag.overCanvas ? 'drag-ghost-ok' : ''}`}
          style={{ left: newDrag.x, top: newDrag.y }}
        >
          <span className="drag-ghost-icon">🌱</span>
          <span className="drag-ghost-name">{newDrag.gewaechs.name}</span>
        </div>
      )}
    </div>
  )
}
