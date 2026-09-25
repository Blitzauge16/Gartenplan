import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import CreatePlantModal from './CreatePlantModal'
import PlantDetailModal from './PlantDetailModal'

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'lateinischer_name', label: 'Lateinischer Name' },
  { key: 'herkunft', label: 'Herkunft' },
  { key: 'benoetigtes_licht', label: 'Licht' },
  { key: 'bluehzeit', label: 'Blühzeit' },
]

const LICHT_OPTIONEN = ['vollsonnig', 'sonnig', 'halbschattig', 'schattig']

export default function PflanzenPage() {
  const [gewaechse, setGewaechse] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selected, setSelected] = useState(null)

  const [search, setSearch] = useState('')
  const [lichtFilter, setLichtFilter] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

  const loadData = async () => {
    try {
      setGewaechse(await api.getGewaechse())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = gewaechse.filter((g) => {
      if (lichtFilter && g.benoetigtes_licht !== lichtFilter) return false
      if (!q) return true
      return (
        g.name?.toLowerCase().includes(q) ||
        g.lateinischer_name?.toLowerCase().includes(q)
      )
    })
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) =>
      dir * (a[sort.key] ?? '').localeCompare(b[sort.key] ?? '', 'de', { sensitivity: 'base' })
    )
  }, [gewaechse, search, lichtFilter, sort])

  const toggleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    )
  }

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
            placeholder="Suche nach Name oder lateinischem Namen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={lichtFilter} onChange={(e) => setLichtFilter(e.target.value)}>
            <option value="">Alle Lichtverhältnisse</option>
            {LICHT_OPTIONEN.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
          {(search || lichtFilter) && (
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() => {
                setSearch('')
                setLichtFilter('')
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
                <tr key={g.id} onClick={() => setSelected(g)}>
                  <td>{g.name}</td>
                  <td className="pflanzen-latin">{g.lateinischer_name}</td>
                  <td>{g.herkunft}</td>
                  <td>{g.benoetigtes_licht}</td>
                  <td>{g.bluehzeit}</td>
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
            key={selected.id}
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
