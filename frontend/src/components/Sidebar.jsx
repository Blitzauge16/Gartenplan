import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getByCategory } from '../data/hotspotMeta'

// Kategorie-Definitionen mit Icon und Label
const CATEGORIES = [
  { key: 'uebersicht', label: 'Übersicht', icon: '🗺️', items: [{ id: '', title: 'Gartenplan' }] },
  { key: 'pflanzen', label: 'Pflanzen', icon: '🌱', items: [{ id: 'pflanzen', title: 'Alle Pflanzen' }] },
  { key: 'gebaeude', label: 'Gebäude', icon: '🏠', items: getByCategory('gebaeude') },
  { key: 'beet', label: 'Beete', icon: '🌸', items: getByCategory('beet') },
  { key: 'hecke', label: 'Hecken', icon: '🌿', items: getByCategory('hecke') },
]

function SidebarCategory({ category, collapsed, expanded, onToggle }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleHeaderClick = () => {
    // Übersicht navigiert direkt zur Startseite
    if (category.key === 'uebersicht') {
      navigate('/')
      return
    }
    // Bei nur einem Item direkt navigieren
    if (category.items.length === 1) {
      const item = category.items[0]
      navigate(item.id === '' ? '/' : `/bereich/${item.id}`)
      return
    }
    onToggle()
  }

  return (
    <div className="sidebar-category">
      <button className="sidebar-category-header" onClick={handleHeaderClick}>
        <span className="sidebar-icon">{category.icon}</span>
        {!collapsed && (
          <>
            <span className="sidebar-category-title">{category.label}</span>
            {category.items.length > 1 && (
              <span className="sidebar-category-arrow">{expanded ? '▾' : '▸'}</span>
            )}
          </>
        )}
      </button>

      {expanded && !collapsed && (
        <ul className="sidebar-list">
          {category.items.map(({ id, title }) => {
            const path = id === '' ? '/' : `/bereich/${id}`
            const isActive = location.pathname === path

            return (
              <li key={id || 'home'}>
                <NavLink
                  to={path}
                  className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                  title={title}
                >
                  <span className="sidebar-text">{title}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState([])

  const toggleExpanded = (key) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
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
        {CATEGORIES.map((category) => (
          <SidebarCategory
            key={category.key}
            category={category}
            collapsed={collapsed}
            expanded={expandedKeys.includes(category.key)}
            onToggle={() => toggleExpanded(category.key)}
          />
        ))}
      </nav>
    </aside>
  )
}
