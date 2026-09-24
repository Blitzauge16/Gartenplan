import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import hotspotMeta from '../data/hotspotMeta'

// Sammle Bereiche in Unterkategorien
const flaechenData = {
  'Gebäude': [],
  'Beete': [],
  'Hecken': [],
}

Object.entries(hotspotMeta).forEach(([id, meta]) => {
  if (meta.alias) return

  if (id.includes('hecke')) {
    flaechenData['Hecken'].push({ id, title: meta.title, icon: '🌿' })
  } else if (id.includes('beet') || id.includes('rosenbeet')) {
    flaechenData['Beete'].push({ id, title: meta.title, icon: '🌸' })
  } else if (['haus', 'schuppen', 'schuppenanbau', 'garage', 'gewaechshaus', 'holzschuppen', 'sitzecke'].includes(id)) {
    flaechenData['Gebäude'].push({ id, title: meta.title, icon: '🏠' })
  }
})

const categories = {
  'Übersicht': [
    { id: '', title: 'Gartenplan', icon: '🗺️' }
  ],
  'Pflanzen': [],
  'Flächen': [], // Wird speziell behandelt
  'Bäume': [],
}

// Bäume direkt kategorisieren
Object.entries(hotspotMeta).forEach(([id, meta]) => {
  if (meta.alias) return
  if (id.includes('baum')) {
    categories['Bäume'].push({ id, title: meta.title, icon: '🌳' })
  }
})

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({
    'Übersicht': false,
    'Pflanzen': false,
    'Flächen': false,
    'Bäume': false,
  })
  const [flaechenSubcategory, setFlaechenSubcategory] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  const toggleCategory = (category) => {
    if (category === 'Übersicht') {
      navigate('/')
      return
    }
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const handleFlaechenSubcategory = (subcategory) => {
    setFlaechenSubcategory(subcategory)
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Menü ausklappen' : 'Menü einklappen'}
      >
        {collapsed ? '▶' : '◀'}
      </button>

      <nav className="sidebar-nav">
        {Object.entries(categories).map(([category, items]) => {
          if (category === 'Flächen') {
            // Spezialbehandlung für Flächen
            const isExpanded = expandedCategories[category]

            return (
              <div key={category} className="sidebar-category">
                <button
                  className="sidebar-category-header"
                  onClick={() => toggleCategory(category)}
                >
                  <span className="sidebar-category-title">{category}</span>
                  {!collapsed && (
                    <span className="sidebar-category-arrow">
                      {isExpanded ? '▾' : '▸'}
                    </span>
                  )}
                </button>

                {isExpanded && (
                  <>
                    {flaechenSubcategory === null ? (
                      // Zeige Unterkategorien-Auswahl
                      <ul className="sidebar-list">
                        {Object.keys(flaechenData).map((subcategory) => (
                          <li key={subcategory}>
                            <button
                              onClick={() => handleFlaechenSubcategory(subcategory)}
                              className="sidebar-link sidebar-subcategory-btn"
                              style={{ textAlign: 'left', cursor: 'pointer', border: 'none', background: 'none', padding: 'inherit', font: 'inherit', color: 'inherit', width: '100%' }}
                            >
                              <span className="sidebar-icon">
                                {subcategory === 'Gebäude' ? '🏠' : subcategory === 'Beete' ? '🌸' : '🌿'}
                              </span>
                              {!collapsed && <span className="sidebar-text">{subcategory}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      // Zeige Items der ausgewählten Unterkategorie
                      <>
                        <ul className="sidebar-list">
                          <li>
                            <button
                              onClick={() => setFlaechenSubcategory(null)}
                              className="sidebar-link sidebar-back-btn"
                              style={{ textAlign: 'left', cursor: 'pointer', color: '#999', border: 'none', background: 'none', padding: 'inherit', font: 'inherit', width: '100%' }}
                            >
                              {!collapsed && <span className="sidebar-text">← Zurück</span>}
                              {collapsed && <span className="sidebar-text">←</span>}
                            </button>
                          </li>
                        </ul>
                        <ul className="sidebar-list">
                          {flaechenData[flaechenSubcategory].map(({ id, title, icon }) => {
                            const path = id === '' ? '/' : `/bereich/${id}`
                            const isActive = location.pathname === path

                            return (
                              <li key={id || 'home'}>
                                <NavLink
                                  to={path}
                                  className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                                  title={title}
                                >
                                  <span className="sidebar-icon">{icon}</span>
                                  {!collapsed && <span className="sidebar-text">{title}</span>}
                                </NavLink>
                              </li>
                            )
                          })}
                        </ul>
                      </>
                    )}
                  </>
                )}
              </div>
            )
          }

          // Normale Behandlung für andere Kategorien
          if (items.length === 0) return null

          const isExpanded = expandedCategories[category]

          return (
            <div key={category} className="sidebar-category">
              <button
                className="sidebar-category-header"
                onClick={() => toggleCategory(category)}
              >
                <span className="sidebar-category-title">{category}</span>
                {!collapsed && (
                  <span className="sidebar-category-arrow">
                    {isExpanded ? '▾' : '▸'}
                  </span>
                )}
              </button>

              {isExpanded && (
                <ul className="sidebar-list">
                  {items.map(({ id, title, icon }) => {
                    const path = id === '' ? '/' : `/bereich/${id}`
                    const isActive = location.pathname === path

                    return (
                      <li key={id || 'home'}>
                        <NavLink
                          to={path}
                          className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                          title={title}
                        >
                          <span className="sidebar-icon">{icon}</span>
                          {!collapsed && <span className="sidebar-text">{title}</span>}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
