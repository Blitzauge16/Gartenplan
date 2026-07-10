import { useEffect } from 'react'
import svgMarkup from '../assets/grundstuecksplan.svg?raw'

export default function InteractiveMap({ onHotspotClick }) {
  useEffect(() => {
    window.handleSvgHotspotClick = (id) => onHotspotClick(id)

    return () => {
      delete window.handleSvgHotspotClick
    }
  }, [onHotspotClick])

  const preparedSvg = svgMarkup
    .replace(/^<\?xml[^>]*\?>/, '')
    .replace(/<!--([\s\S]*?)-->/g, '')

  return (
    <div
      className="asset-svg"
      dangerouslySetInnerHTML={{ __html: preparedSvg }}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  )
}
