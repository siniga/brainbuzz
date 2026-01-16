function DashboardNav({ 
  view, 
  onNavigate, 
  subjectsEnabled, 
  skillsEnabled, 
  sessionsEnabled, 
  questionsEnabled 
}) {
  return (
    <nav className="dashboard-nav">
      <button
        type="button"
        className={`nav-button ${view === 'standards' ? 'active' : ''}`}
        onClick={() => onNavigate('standards')}
      >
        Standards
      </button>
      <button
        type="button"
        className={`nav-button ${view === 'subjects' ? 'active' : ''}`}
        onClick={() => onNavigate('subjects')}
        disabled={!subjectsEnabled}
      >
        Subjects
      </button>
      <button
        type="button"
        className={`nav-button ${view === 'skills' ? 'active' : ''}`}
        onClick={() => onNavigate('skills')}
        disabled={!skillsEnabled}
      >
        Skills
      </button>
      <button
        type="button"
        className={`nav-button ${view === 'sessions' ? 'active' : ''}`}
        onClick={() => onNavigate('sessions')}
        disabled={!sessionsEnabled}
      >
        Sessions
      </button>
      <button
        type="button"
        className={`nav-button ${view === 'questions' ? 'active' : ''}`}
        onClick={() => onNavigate('questions')}
        disabled={!questionsEnabled}
      >
        Questions
      </button>
    </nav>
  )
}

export default DashboardNav
