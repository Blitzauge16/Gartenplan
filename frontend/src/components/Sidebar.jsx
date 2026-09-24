import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import hotspotMeta from '../data/hotspotMeta'

// Kategorien für die Navigation (nur Hauptbereiche ohne alias)
const categories = {
  'Übersicht': [
    { id: '', title: 'Gartenplan', icon: '🗺️' }
  ],
  'Gebäude': [],
  'Beete': [],
  'Bäume': [],
  'Hecken': [],
}

// Bereiche den Kategorien zuordnen
Object.entries(hotspotMeta).forEach(([id, meta]) => {
  // Nur Hauptbereiche (ohne alias) in die Navigation
  if (meta.alias) return

  if (id.includes('hecke')) {
    categories['Hecken'].push({ id, title: meta.title, icon: '🌿' })
  } else if (id.includes('beet') || id.includes('rosenbeet')) {
    categories['Beete'].push({ id, title: meta.title, icon: '🌸' })
  } else if (id.includes('baum')) {
    categories['Bäume'].push({ id, title: meta.title, icon: '🌳' })
  } else if (['haus', 'schuppen', 'schuppenanbau', 'garage', 'gewaechshaus', 'holzschuppen', 'sitzecke'].includes(id)) {
    categories['Gebäude'].push({ id, title: meta.title, icon: '🏠' })
  }
})

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({
    'Übersicht': true,
    'Gebäude': true,
    'Beete': true,
    'Bäume': false,
    'Hecken': false,
  })
  const location = useLocation()

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
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
