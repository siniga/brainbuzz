import { useState, useEffect } from 'react'
import QuestionEditor from './QuestionEditor'

function QuestionsList({
  selectedSkill,
  selectedSession,
  questions,
  loadingQuestions,
  onBack,
}) {
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [localQuestions, setLocalQuestions] = useState(questions)

  // Base URL for images
  const IMAGE_BASE_URL = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/'

  // Update local questions when props change
  useEffect(() => {
    setLocalQuestions(questions)
  }, [questions])

  // Helper function to get full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    
    // If the URL already starts with http/https, use it as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    
    // Remove leading slash and backslashes (replace backslashes with forward slashes)
    const cleanPath = imageUrl.replace(/\\/g, '/').replace(/^\//, '')
    const fullUrl = `${IMAGE_BASE_URL}${cleanPath}`
    
    return fullUrl
  }

  // Helper function to parse media_url (can be string or JSON array)
  const getMediaUrls = (mediaUrl) => {
    if (!mediaUrl) return []
    
    // Check if it's a JSON array string
    if (mediaUrl.startsWith('[')) {
      try {
        const parsed = JSON.parse(mediaUrl)
        return Array.isArray(parsed) ? parsed : [mediaUrl]
      } catch (e) {
        return [mediaUrl]
      }
    }
    
    return [mediaUrl]
  }

  // Get option label (A, B, C, D, etc.)
  const getOptionLabel = (index) => {
    return String.fromCharCode(65 + index) // 65 is 'A' in ASCII
  }

  const handleEditClick = (questionId) => {
    setEditingQuestionId(questionId)
  }

  const handleSaveQuestion = async (questionId, formData) => {
    const baseUrl = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/api'
    
    try {
      const response = await fetch(`${baseUrl}/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to update question')

      const updatedQuestion = await response.json()
      
      // Update local state
      setLocalQuestions(prev => 
        prev.map(q => q.id === questionId ? updatedQuestion : q)
      )
      
      setEditingQuestionId(null)
      alert('Question updated successfully!')
    } catch (error) {
      console.error('Error updating question:', error)
      alert('Failed to update question. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setEditingQuestionId(null)
  }

  if (!selectedSkill || !selectedSession) {
    return (
      <section className="questions">
        <h2>Questions</h2>
        <p>Please select a session first to view questions.</p>
      </section>
    )
  }

  return (
    <section className="questions">
      <button type="button" className="back-button" onClick={onBack}>
        ← Back to Sessions
      </button>
      <h2>
        {selectedSkill.name ?? `Skill #${selectedSkill.id}`} - Session {selectedSession.number}
      </h2>
      {loadingQuestions && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
      {!loadingQuestions && localQuestions.length === 0 && (
        <p>No questions found for this session.</p>
      )}
      {!loadingQuestions && localQuestions.length > 0 && (
        <div className="question-list">
          {localQuestions.map((question, index) => {
            const mediaUrls = getMediaUrls(question.media_url)
            const options = question.options_json || []
            const isImageSelection = question.type === 'image_selection'
            const isEditing = editingQuestionId === question.id
            
            if (isEditing) {
              return (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  onSave={handleSaveQuestion}
                  onCancel={handleCancelEdit}
                />
              )
            }
            
            return (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <span className="question-number">Question {index + 1}</span>
                <div className="question-header-actions">
                  <span className="question-type">{question.type?.toUpperCase() || 'MCQ'}</span>
                  <button
                    type="button"
                    className="edit-question-btn"
                    onClick={() => handleEditClick(question.id)}
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
              <div className="question-text">{question.question_text}</div>
              
              {/* Audio Player */}
              {question.audio_url && (
                <div className="question-audio">
                  <audio controls src={getImageUrl(question.audio_url)}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              
              {/* Single image for regular questions */}
              {!isImageSelection && mediaUrls.length > 0 && (
                <div className="question-image">
                  <img 
                    src={getImageUrl(mediaUrls[0])} 
                    alt="Question illustration"
                    onError={(e) => {
                      console.error('Failed to load image:', e.target.src)
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}

              {/* Multiple images for image_selection questions */}
              {isImageSelection && mediaUrls.length > 0 && (
                <div className="question-image-grid">
                  {mediaUrls.map((url, idx) => (
                    <div key={idx} className="image-option">
                      <img 
                        src={getImageUrl(url)} 
                        alt={`Option ${idx + 1}`}
                        onError={(e) => {
                          console.error('Failed to load image:', e.target.src)
                          e.target.style.display = 'none'
                        }}
                      />
                      <div className="image-option-label">Option {idx + 1}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Text options */}
              <div className="question-options">
                {options.map((option, idx) => (
                  <div key={idx} className="option">
                    <span className="option-label">{getOptionLabel(idx)})</span> {option}
                  </div>
                ))}
              </div>
              
              <div className="question-answer">
                <strong>Correct Answer:</strong> {question.correct_answer}
              </div>
            </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default QuestionsList
