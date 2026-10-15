// Rückfrage vor dem Löschen eines things, das noch im Plan steht.
export default function ConfirmDeleteDialog({ name, standorte, saving, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-content confirm-dialog">
        <div className="modal-header">
          <h2>Wirklich löschen?</h2>
        </div>
        <div className="modal-body">
          <p>
            <strong>{name}</strong> steht noch an {standorte.length}{' '}
            {standorte.length === 1 ? 'Standort' : 'Standorten'}. Diese Platzierungen werden
            ebenfalls gelöscht:
          </p>
          <ul className="confirm-list">
            {standorte.map((s) => (
              <li key={s.id}>{s.label}</li>
            ))}
          </ul>
        </div>
        <div className="modal-footer">
          <button type="button" className="editor-button editor-button-secondary" onClick={onCancel}>
            Abbrechen
          </button>
          <button
            type="button"
            className="editor-button editor-button-danger"
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? 'Löscht...' : 'Endgültig löschen'}
          </button>
        </div>
      </div>
    </div>
  )
}
