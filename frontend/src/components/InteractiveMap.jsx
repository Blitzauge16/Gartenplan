import { useEffect, useRef } from 'react'
import svgMarkup from '../assets/grundstuecksplan.svg?raw'
import hotspotMeta from '../data/hotspotMeta'

const preparedSvg = svgMarkup
  .replace(/^<\?xml[^>]*\?>/, '')
  .replace(/<!--([\s\S]*?)-->/g, '')
  .replace(/\sonclick="[^"]*"/g, '')

export default function InteractiveMap({ onHotspotClick }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.querySelectorAll('[inkscape\\:label]').forEach((el) => {
      if (hotspotMeta[el.getAttribute('inkscape:label')]) {
        el.style.cursor = 'pointer'
      }
    })

    const handleClick = (event) => {
      let el = event.target
      while (el && el !== container) {
        const label = el.getAttribute?.('inkscape:label')
        if (label && hotspotMeta[label]) {
          onHotspotClick(label)
          return
        }
        el = el.parentElement
      }
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [onHotspotClick])

  return (
    <div className="svg-wrapper">
      <div
        ref={containerRef}
        className="asset-svg"
        dangerouslySetInnerHTML={{ __html: preparedSvg }}
      />
    </div>
  )
}
