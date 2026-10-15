import { useEffect, useMemo, useState } from 'react'
import { api, assetUrl } from '../api'
import ObjektModal from './ObjektModal'

// Übersicht aller Objekte (Gegenstände) mit Suche; Klick auf eine Zeile
// öffnet das Bearbeiten-Popup.
export default function ObjektePage() {
  const [objekte, setObjekte] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // null | 'neu' | objekt
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

  // Erhöhen löst ein erneutes Laden der Daten aus
  const [reloadKey, setReloadKey] = useState(0)
  const loadData = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    let active = true
    api
      .getObjects()
      .then((data) => {
        if (!active) return
        setObjekte(data)
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

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? objekte.filter((o) => o.name?.toLowerCase().includes(q) || o.notizen?.toLowerCase().includes(q))
      : objekte
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      if (typeof av === 'number' && typeof bv === 'number') return dir * (av - bv)
      return dir * String(av ?? '').localeCompare(String(bv ?? ''), 'de', { sensitivity: 'base' })
    })
  }, [objekte, search, sort])

  const toggleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    )
  }

  const COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'notizen', label: 'Notizen' },
    { key: 'anzahl_platzierungen', label: 'Im Plan' },
  ]

  if (loading) return <p>Lade Objekte...</p>
  if (error) return <p className="editor-error">{error}</p>

  return (
    <section className="main-layout">
      <div className="canvas-section pflanzen-section">
        <h2>📦 Alle Objekte</h2>

        <div className="pflanzen-toolbar">
          <input
            type="search"
            className="pflanzen-search"
            placeholder="Suche nach Name oder Notizen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() => setSearch('')}
            >
              Zurücksetzen
            </button>
          )}
          <button type="button" className="editor-button" onClick={() => setModal('neu')}>
            + Neues Objekt
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
                  {objekte.length === 0 ? 'Noch keine Objekte angelegt.' : 'Keine Treffer.'}
                </td>
              </tr>
            ) : (
              rows.map((o) => (
                <tr key={o.thing_id} onClick={() => setModal(o)}>
                  <td className="pflanzen-name-cell">
                    {o.icon_url ? (
                      <img className="pflanzen-icon" src={assetUrl(o.icon_url)} alt="" />
                    ) : (
                      <span className="pflanzen-icon pflanzen-icon-default">📦</span>
                    )}
                    {o.name}
                  </td>
                  <td className="pflanzen-notizen">{o.notizen}</td>
                  <td>{o.anzahl_platzierungen > 0 ? `${o.anzahl_platzierungen}×` : '–'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {modal && (
          <ObjektModal
            key={modal === 'neu' ? 'neu' : modal.thing_id}
            objekt={modal === 'neu' ? null : modal}
            onClose={() => setModal(null)}
            onSaved={loadData}
            onDeleted={loadData}
          />
        )}
      </div>
    </section>
  )
}
