// Extrahiert die Form eines Areals aus dem Gesamtplan (grundstuecksplan.svg).
// Die Master-SVG bleibt die einzige Quelle für Geometrie: Wir suchen die Elemente
// mit den passenden inkscape:labels, messen sie im Browser (getBBox/getScreenCTM)
// und geben Markup + passgenaue viewBox zurück — alles in Plan-Koordinaten,
// also demselben Koordinatensystem, in dem die Orte im Backend gespeichert werden.
// Ein Bereich kann aus mehreren Teilflächen bestehen (z. B. haus + haus_varanda
// + haus_tuer); dann wird die kombinierte Form mit gemeinsamer Bounding-Box geliefert.
import svgMarkup from '../assets/grundstuecksplan.svg?raw'

export function extractArea(labels) {
  const wanted = new Set(Array.isArray(labels) ? labels : [labels])

  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml')
  const root = document.importNode(doc.documentElement, true)

  // Zum Messen muss die SVG kurz (unsichtbar) im Dokument hängen,
  // sonst liefern getBBox/getScreenCTM nichts.
  const holder = document.createElement('div')
  holder.style.cssText = 'position:absolute;left:-99999px;top:0;width:1000px;visibility:hidden'
  holder.appendChild(root)
  document.body.appendChild(holder)

  try {
    const elements = [...root.querySelectorAll('*')].filter(
      (node) => node.getAttribute && wanted.has(node.getAttribute('inkscape:label'))
    )
    if (elements.length === 0) return null

    const rootInverse = root.getScreenCTM()?.inverse()
    if (!rootInverse) return null

    const serializer = new XMLSerializer()
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    let shapeMarkup = ''

    for (const el of elements) {
      if (typeof el.getBBox !== 'function') continue
      const elMatrix = el.getScreenCTM()
      const parentMatrix = el.parentNode.getScreenCTM()
      if (!elMatrix || !parentMatrix) continue

      // Matrix vom lokalen Koordinatensystem des Elements in Plan-Koordinaten
      // (inkl. eigener transform) — für die Bounding-Box.
      const toPlan = rootInverse.multiply(elMatrix)
      // Matrix des Eltern-Layers (ohne eigene transform des Elements) —
      // als Wrapper, weil das serialisierte Element seine transform schon enthält.
      const m = rootInverse.multiply(parentMatrix)

      const bbox = el.getBBox()
      const corners = [
        [bbox.x, bbox.y],
        [bbox.x + bbox.width, bbox.y],
        [bbox.x, bbox.y + bbox.height],
        [bbox.x + bbox.width, bbox.y + bbox.height],
      ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(toPlan))

      for (const p of corners) {
        minX = Math.min(minX, p.x)
        maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y)
        maxY = Math.max(maxY, p.y)
      }

      shapeMarkup +=
        `<g transform="matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})">` +
        serializer.serializeToString(el) +
        '</g>'
    }

    if (!shapeMarkup) return null

    const pad = Math.max(maxX - minX, maxY - minY) * 0.08

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
