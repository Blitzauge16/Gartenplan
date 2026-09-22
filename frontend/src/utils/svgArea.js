// Extrahiert die Form eines Areals aus dem Gesamtplan (grundstuecksplan.svg).
// Die Master-SVG bleibt die einzige Quelle für Geometrie: Wir suchen das Element
// mit dem passenden inkscape:label, messen es im Browser (getBBox/getScreenCTM)
// und geben Markup + passgenaue viewBox zurück — alles in Plan-Koordinaten,
// also demselben Koordinatensystem, in dem die Orte im Backend gespeichert werden.
import svgMarkup from '../assets/grundstuecksplan.svg?raw'

export function extractArea(label) {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml')
  const root = document.importNode(doc.documentElement, true)

  // Zum Messen muss die SVG kurz (unsichtbar) im Dokument hängen,
  // sonst liefern getBBox/getScreenCTM nichts.
  const holder = document.createElement('div')
  holder.style.cssText = 'position:absolute;left:-99999px;top:0;width:1000px;visibility:hidden'
  holder.appendChild(root)
  document.body.appendChild(holder)

  try {
    const el = [...root.querySelectorAll('*')].find(
      (node) => node.getAttribute && node.getAttribute('inkscape:label') === label
    )
    if (!el || typeof el.getBBox !== 'function') return null

    const rootInverse = root.getScreenCTM()?.inverse()
    const elMatrix = el.getScreenCTM()
    const parentMatrix = el.parentNode.getScreenCTM()
    if (!rootInverse || !elMatrix || !parentMatrix) return null

    // Matrix vom lokalen Koordinatensystem des Elements in Plan-Koordinaten
    // (inkl. eigener transform) — für die Bounding-Box.
    const toPlan = rootInverse.multiply(elMatrix)
    // Matrix des Eltern-Layers (ohne eigene transform des Elements) —
    // als Wrapper, weil el.outerHTML seine eigene transform schon enthält.
    const parentToPlan = rootInverse.multiply(parentMatrix)

    const bbox = el.getBBox()
    const corners = [
      [bbox.x, bbox.y],
      [bbox.x + bbox.width, bbox.y],
      [bbox.x, bbox.y + bbox.height],
      [bbox.x + bbox.width, bbox.y + bbox.height],
    ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(toPlan))

    const minX = Math.min(...corners.map((p) => p.x))
    const maxX = Math.max(...corners.map((p) => p.x))
    const minY = Math.min(...corners.map((p) => p.y))
    const maxY = Math.max(...corners.map((p) => p.y))
    const pad = Math.max(maxX - minX, maxY - minY) * 0.08

    const m = parentToPlan
    const shapeMarkup =
      `<g transform="matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})">` +
      new XMLSerializer().serializeToString(el) +
      '</g>'

    return {
      shapeMarkup,
      viewBox: {
        x: minX - pad,
        y: minY - pad,
        width: maxX - minX + 2 * pad,
        height: maxY - minY + 2 * pad,
      },
    }
  } finally {
    holder.remove()
  }
}
