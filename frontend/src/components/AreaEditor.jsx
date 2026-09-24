import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { extractArea } from '../utils/svgArea'
import { labelsForBereich } from '../data/hotspotMeta'
import { api } from '../api'
import CreatePlantModal from './CreatePlantModal'

// Editor für ein Areal: zeigt die Form des Bereichs (aus der Master-SVG) und
// erlaubt, Pflanzen per Klick zu platzieren und per Drag zu verschieben.
// Positionen werden in Plan-Koordinaten im Backend gespeichert (Tabelle ort),
// die Verknüpfung Pflanze<->Position in der Tabelle gepflanzt.
export default function AreaEditor({ bereich }) {
  const [area, setArea] = useState(null)
  const [pflanzungen, setPflanzungen] = useState([])
  const [gewaechse, setGewaechse] = useState([])
  const [selectedGewaechs, setSelectedGewaechs] = useState('')
  const [selectedPflanzungId, setSelectedPflanzungId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [saving, setSaving] = useState(false)

  const svgRef = useRef(null)
  const dragRef = useRef(null) // { pflanzungId, ortId, moved, x, y }
  const suppressClickRef = useRef(false)

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

  // Klick in die Fläche: neuen Ort + Pflanzung anlegen
  const handleSvgClick = async (event) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (!selectedGewaechs || saving) return
    const { x, y } = toPlanCoords(event)
    setSaving(true)
    try {
      const ort = await api.createOrt({ x_koordinate: x, y_koordinate: y, bereich })
      await api.createPflanzung({
        ort_id: ort.id,
        gewaechs_id: Number(selectedGewaechs),
        datum: new Date().toISOString().slice(0, 10),
      })
      await loadData()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
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
      suppressClickRef.current = true
      return
    }
    suppressClickRef.current = true
    try {
      await api.updateOrt(drag.ortId, { x_koordinate: drag.x, y_koordinate: drag.y, bereich })
    } catch (err) {
      setApiError(err.message)
      loadData() // Position zurücksetzen, wenn das Speichern fehlschlug
    }
  }

  const handlePlantCreated = async (neu) => {
    await loadData()
    setSelectedGewaechs(String(neu.id))
  }

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
      <div className="area-canvas">
        <svg
          ref={svgRef}
          viewBox={`${x} ${y} ${width} ${height}`}
          onClick={handleSvgClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: selectedGewaechs ? 'crosshair' : 'default' }}
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
          <label htmlFor="gewaechs-select">Pflanze auswählen</label>
          <select
            id="gewaechs-select"
            value={selectedGewaechs}
            onChange={(e) => setSelectedGewaechs(e.target.value)}
          >
            <option value="">– keine ausgewählt –</option>
            {gewaechse.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <p className="editor-hint">
            {selectedGewaechs
              ? 'Jetzt in die Fläche klicken, um zu pflanzen.'
              : 'Pflanze wählen, dann in die Fläche klicken. Marker lassen sich ziehen.'}
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
              className="editor-button editor-button-danger"
              onClick={() => handleDelete(selectedPflanzung)}
            >
              Pflanzung löschen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
