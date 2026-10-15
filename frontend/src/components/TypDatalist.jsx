import { TYP_VORSCHLAEGE } from '../data/options'

// Vorschlagsliste für das Feld "Typ" einer Pflanze. Wird per
// <input list="plant-typ-vorschlaege" /> an ein Textfeld gehängt.
export default function TypDatalist() {
  return (
    <datalist id="plant-typ-vorschlaege">
      {TYP_VORSCHLAEGE.map((t) => (
        <option key={t} value={t} />
      ))}
    </datalist>
  )
}
