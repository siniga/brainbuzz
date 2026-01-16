function SubjectsList({
  selectedStandard,
  subjects,
  loadingSubjects,
  onBack,
  onSelect,
}) {
  if (!selectedStandard) {
    return (
      <section className="subjects">
        <h2>Available Subjects</h2>
        <p>Please select a standard first to view available subjects.</p>
      </section>
    )
  }

  return (
    <section className="subjects">
      <button type="button" className="back-button" onClick={onBack}>
        ← Back to Standards
      </button>
      <h2>{selectedStandard.name ?? `Standard #${selectedStandard.id}`} - Subjects</h2>
      {loadingSubjects && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
      {!loadingSubjects && subjects.length === 0 && (
        <p>No subjects found for this standard.</p>
      )}
      {!loadingSubjects && subjects.length > 0 && (
        <ul className="subject-list">
          {subjects.map((subject) => (
            <li
              key={subject.id}
              onClick={() => onSelect(subject)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  onSelect(subject)
                }
              }}
            >
              {subject.name ?? `Subject #${subject.id}`}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default SubjectsList
