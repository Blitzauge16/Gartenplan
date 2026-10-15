import { useEffect, useMemo, useState } from 'react'
import { api, assetUrl } from '../api'
import { LICHT_OPTIONEN } from '../data/options'
import CreatePlantModal from './CreatePlantModal'
import PlantDetailModal from './PlantDetailModal'

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'lateinischer_name', label: 'Lateinischer Name' },
  { key: 'typ', label: 'Typ' },
  { key: 'herkunft', label: 'Herkunft' },
  { key: 'benoetigtes_licht', label: 'Licht' },
  { key: 'bluehzeit', label: 'Blühzeit' },
  { key: 'anzahl_platzierungen', label: 'Im Plan' },
]

export default function PflanzenPage() {
  const [gewaechse, setGewaechse] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selected, setSelected] = useState(null)

  const [search, setSearch] = useState('')
  const [lichtFilter, setLichtFilter] = useState('')
  const [typFilter, setTypFilter] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

  // Erhöhen löst ein erneutes Laden der Daten aus
  const [reloadKey, setReloadKey] = useState(0)
  const loadData = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    let active = true
    api
      .getGewaechse()
      .then((data) => {
        if (!active) return
        setGewaechse(data)
        setError(null)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  // Alle vorkommenden Typen für den Filter
  const typen = useMemo(
    () => [...new Set(gewaechse.map((g) => g.typ).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de')),
    [gewaechse]
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = gewaechse.filter((g) => {
      if (lichtFilter && g.benoetigtes_licht !== lichtFilter) return false
      if (typFilter && g.typ !== typFilter) return false
      if (!q) return true
      return (
        g.name?.toLowerCase().includes(q) ||
        g.lateinischer_name?.toLowerCase().includes(q) ||
        g.typ?.toLowerCase().includes(q)
      )
    })
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      if (typeof av === 'number' && typeof bv === 'number') return dir * (av - bv)
      return dir * String(av ?? '').localeCompare(String(bv ?? ''), 'de', { sensitivity: 'base' })
    })
  }, [gewaechse, search, lichtFilter, typFilter, sort])

  const toggleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    )
  }

  const hasFilter = search || lichtFilter || typFilter

  if (loading) return <p>Lade Pflanzen...</p>
  if (error) return <p className="editor-error">{error}</p>

  return (
    <section className="main-layout">
      <div className="canvas-section pflanzen-section">
        <h2>🌱 Alle Pflanzen</h2>

        <div className="pflanzen-toolbar">
          <input
            type="search"
            className="pflanzen-search"
            placeholder="Suche nach Name, lateinischem Namen oder Typ…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={typFilter} onChange={(e) => setTypFilter(e.target.value)}>
            <option value="">Alle Typen</option>
            {typen.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={lichtFilter} onChange={(e) => setLichtFilter(e.target.value)}>
            <option value="">Alle Lichtverhältnisse</option>
            {LICHT_OPTIONEN.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
          {hasFilter && (
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() => {
                setSearch('')
                setLichtFilter('')
                setTypFilter('')
              }}
            >
              Zurücksetzen
            </button>
          )}
          <button type="button" className="editor-button" onClick={() => setShowCreateModal(true)}>
            + Neue Pflanze
          </button>
        </div>

        <table className="pflanzen-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} onClick={() => toggleSort(col.key)}>
                  {col.label}
                  {sort.key === col.key && <span className="sort-arrow">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="pflanzen-empty">
                  {gewaechse.length === 0 ? 'Noch keine Pflanzen angelegt.' : 'Keine Treffer.'}
                </td>
              </tr>
            ) : (
              rows.map((g) => (
                <tr key={g.thing_id} onClick={() => setSelected(g)}>
                  <td className="pflanzen-name-cell">
                    {g.icon_url ? (
                      <img className="pflanzen-icon" src={assetUrl(g.icon_url)} alt="" />
                    ) : (
                      <span className="pflanzen-icon pflanzen-icon-default">🌱</span>
                    )}
                    {g.name}
                  </td>
                  <td className="pflanzen-latin">{g.lateinischer_name}</td>
                  <td>{g.typ}</td>
                  <td>{g.herkunft}</td>
                  <td>{g.benoetigtes_licht}</td>
                  <td>{g.bluehzeit}</td>
                  <td>{g.anzahl_platzierungen > 0 ? `${g.anzahl_platzierungen}×` : '–'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <CreatePlantModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadData}
        />

        {selected && (
          <PlantDetailModal
            key={selected.thing_id}
            gewaechs={selected}
            onClose={() => setSelected(null)}
            onSaved={loadData}
            onDeleted={loadData}
          />
        )}
      </div>
    </section>
  )
}
