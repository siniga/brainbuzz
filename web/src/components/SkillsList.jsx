function SkillsList({
  selectedSubject,
  skills,
  loadingSkills,
  onBack,
  onSelect,
}) {
  if (!selectedSubject) {
    return (
      <section className="skills">
        <h2>Available Skills</h2>
        <p>Please select a subject first to view available skills.</p>
      </section>
    )
  }

  return (
    <section className="skills">
      <button type="button" className="back-button" onClick={onBack}>
        ← Back to Subjects
      </button>
      <h2>{selectedSubject.name ?? `Subject #${selectedSubject.id}`} - Skills</h2>
      {loadingSkills && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
      {!loadingSkills && skills.length === 0 && (
        <p>No skills found for this subject.</p>
      )}
      {!loadingSkills && skills.length > 0 && (
        <ul className="skill-list">
          {skills.map((skill) => (
            <li
              key={skill.id}
              onClick={() => onSelect(skill)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  onSelect(skill)
                }
              }}
            >
              <div className="skill-name">{skill.name ?? `Skill #${skill.id}`}</div>
              {skill.category && <div className="skill-category">{skill.category}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default SkillsList
