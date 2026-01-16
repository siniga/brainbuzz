function SessionsList({
  selectedSkill,
  onBack,
  onSelect,
}) {
  if (!selectedSkill) {
    return (
      <section className="sessions">
        <h2>Available Sessions</h2>
        <p>Please select a skill first to view available sessions.</p>
      </section>
    )
  }

  // Generate sessions based on total_sessions from the skill
  const totalSessions = selectedSkill.total_sessions || 10
  const sessions = Array.from({ length: totalSessions }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    name: `Session ${i + 1}`,
  }))

  return (
    <section className="sessions">
      <button type="button" className="back-button" onClick={onBack}>
        ← Back to Skills
      </button>
      <h2>{selectedSkill.name ?? `Skill #${selectedSkill.id}`} - Sessions</h2>
      <p className="session-subtitle">Choose a session to practice</p>
      <ul className="session-list">
        {sessions.map((session) => (
          <li
            key={session.id}
            onClick={() => onSelect(session)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                onSelect(session)
              }
            }}
          >
            <div className="session-number">{session.number}</div>
            <div className="session-name">{session.name}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default SessionsList
