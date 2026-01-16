function StandardsList({ standards, loading, error, onSelect }) {
  return (
    <section className="standards-section">
      <h2>Select Your Standard</h2>
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {!loading && !error && standards.length === 0 && (
        <p>No standards available at the moment.</p>
      )}
      {!loading && !error && standards.length > 0 && (
        <ul className="standards">
          {standards.map((standard) => (
            <li
              key={standard.id}
              onClick={() => onSelect(standard)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  onSelect(standard)
                }
              }}
            >
              {standard.name ?? `Standard #${standard.id}`}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default StandardsList
