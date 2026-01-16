import { useEffect, useState } from 'react'
import DashboardNav from './components/DashboardNav'
import StandardsList from './components/StandardsList'
import SubjectsList from './components/SubjectsList'
import SkillsList from './components/SkillsList'
import SessionsList from './components/SessionsList'
import QuestionsList from './components/QuestionsList'
import './App.css'

function App() {
  const [standards, setStandards] = useState([])
  const [subjects, setSubjects] = useState([])
  const [skills, setSkills] = useState([])
  const [questions, setQuestions] = useState([])
  const [selectedStandard, setSelectedStandard] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [view, setView] = useState('standards')
  const [loading, setLoading] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const baseUrl = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/api'
    const url = `${baseUrl}/standards`

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2625f657-4b15-4243-8df8-b6f7cadf8a91',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:12',message:'Standards fetch init',data:{baseUrl,url},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2625f657-4b15-4243-8df8-b6f7cadf8a91',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:13',message:'Env VITE_API_BASE_URL',data:{VITE_API_BASE_URL:import.meta.env.VITE_API_BASE_URL || null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2625f657-4b15-4243-8df8-b6f7cadf8a91',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:14',message:'Runtime environment',data:{origin:window.location.origin,href:window.location.href,online:navigator.onLine},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion

    fetch(url)
      .then((res) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2625f657-4b15-4243-8df8-b6f7cadf8a91',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:18',message:'Fetch response received',data:{ok:res.ok,status:res.status,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2625f657-4b15-4243-8df8-b6f7cadf8a91',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:24',message:'Parsed standards data',data:{isArray:Array.isArray(data),length:Array.isArray(data)?data.length:null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        setStandards(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2625f657-4b15-4243-8df8-b6f7cadf8a91',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:29',message:'Fetch error',data:{name:err?.name||null,message:err?.message||null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        setError(err.message || 'Failed to load standards')
      })
      .finally(() => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2625f657-4b15-4243-8df8-b6f7cadf8a91',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:34',message:'Fetch complete',data:{loading:false},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        setLoading(false)
      })

    // #region agent log
    fetch(url, { mode: 'no-cors' })
      .then(() => {
        fetch('http://127.0.0.1:7243/ingest/2625f657-4b15-4243-8df8-b6f7cadf8a91',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:40',message:'No-cors probe success',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
      })
      .catch((err) => {
        fetch('http://127.0.0.1:7243/ingest/2625f657-4b15-4243-8df8-b6f7cadf8a91',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:43',message:'No-cors probe error',data:{url,name:err?.name||null,message:err?.message||null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
      })
    // #endregion
  }, [])

  const handleStandardClick = (standard) => {
    const baseUrl = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/api'
    const url = `${baseUrl}/subjects`

    setSelectedStandard(standard)
    setView('subjects')
    setLoadingSubjects(true)
    setError('')

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setSubjects(list)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load subjects')
        setSubjects([])
      })
      .finally(() => {
        setLoadingSubjects(false)
      })
  }

  const handleSubjectClick = (subject) => {
    const baseUrl = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/api'
    const url = `${baseUrl}/subjects/${subject.id}/skills`

    setSelectedSubject(subject)
    setView('skills')
    setLoadingSkills(true)
    setError('')

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setSkills(list)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load skills')
        setSkills([])
      })
      .finally(() => {
        setLoadingSkills(false)
      })
  }

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill)
    setView('sessions')
  }

  const handleSessionClick = (session) => {
    const baseUrl = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/api'
    const url = `${baseUrl}/skills/${selectedSkill.id}/questions?session=${session.number}`

    setSelectedSession(session)
    setView('questions')
    setLoadingQuestions(true)
    setError('')

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setQuestions(list)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load questions')
        setQuestions([])
      })
      .finally(() => {
        setLoadingQuestions(false)
      })
  }

  const handleBackToStandards = () => {
    setView('standards')
    setSelectedStandard(null)
    setSelectedSubject(null)
    setSelectedSkill(null)
    setSelectedSession(null)
    setSubjects([])
    setSkills([])
    setQuestions([])
    setError('')
  }

  const handleBackToSubjects = () => {
    setView('subjects')
    setSelectedSubject(null)
    setSelectedSkill(null)
    setSelectedSession(null)
    setSkills([])
    setQuestions([])
    setError('')
  }

  const handleBackToSkills = () => {
    setView('skills')
    setSelectedSkill(null)
    setSelectedSession(null)
    setQuestions([])
    setError('')
  }

  const handleBackToSessions = () => {
    setView('sessions')
    setSelectedSession(null)
    setQuestions([])
    setError('')
  }

  const handleNavigate = (nextView) => {
    if (nextView === 'standards') {
      handleBackToStandards()
      return
    }
    if (nextView === 'subjects' && selectedStandard) {
      setView('subjects')
      return
    }
    if (nextView === 'skills' && selectedSubject) {
      setView('skills')
      return
    }
    if (nextView === 'sessions' && selectedSkill) {
      setView('sessions')
      return
    }
    if (nextView === 'questions' && selectedSession) {
      setView('questions')
    }
  }

  return (
    <div className="app">
      <h1>BrainBuzz Learning Dashboard</h1>
      <DashboardNav
        view={view}
        onNavigate={handleNavigate}
        subjectsEnabled={Boolean(selectedStandard)}
        skillsEnabled={Boolean(selectedSubject)}
        sessionsEnabled={Boolean(selectedSkill)}
        questionsEnabled={Boolean(selectedSession)}
      />
      {view === 'standards' && (
        <StandardsList
          standards={standards}
          loading={loading}
          error={error}
          onSelect={handleStandardClick}
        />
      )}
      {view === 'subjects' && (
        <SubjectsList
          selectedStandard={selectedStandard}
          subjects={subjects}
          loadingSubjects={loadingSubjects}
          onBack={handleBackToStandards}
          onSelect={handleSubjectClick}
        />
      )}
      {view === 'skills' && (
        <SkillsList
          selectedSubject={selectedSubject}
          skills={skills}
          loadingSkills={loadingSkills}
          onBack={handleBackToSubjects}
          onSelect={handleSkillClick}
        />
      )}
      {view === 'sessions' && (
        <SessionsList
          selectedSkill={selectedSkill}
          onBack={handleBackToSkills}
          onSelect={handleSessionClick}
        />
      )}
      {view === 'questions' && (
        <QuestionsList
          selectedSkill={selectedSkill}
          selectedSession={selectedSession}
          questions={questions}
          loadingQuestions={loadingQuestions}
          onBack={handleBackToSessions}
        />
      )}
    </div>
  )
}

export default App