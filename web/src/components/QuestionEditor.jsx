import { useState } from 'react'

function QuestionEditor({ question, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    question_text: question.question_text || '',
    options_json: question.options_json || [],
    correct_answer: question.correct_answer || '',
    media_url: question.media_url || '',
    audio_url: question.audio_url || '',
    type: question.type || 'mcq'
  })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewUrls, setPreviewUrls] = useState([])
  const [selectedAudio, setSelectedAudio] = useState(null)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [audioPreview, setAudioPreview] = useState(null)

  const IMAGE_BASE_URL = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/'

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    const cleanPath = imageUrl.replace(/\\/g, '/').replace(/^\//, '')
    return `${IMAGE_BASE_URL}${cleanPath}`
  }

  // Parse media_url which could be a string or JSON array
  const getCurrentImages = () => {
    if (!formData.media_url) return []
    
    // Check if it's a JSON array string
    if (formData.media_url.startsWith('[')) {
      try {
        const parsed = JSON.parse(formData.media_url)
        return Array.isArray(parsed) ? parsed : [formData.media_url]
      } catch (e) {
        return [formData.media_url]
      }
    }
    
    return [formData.media_url]
  }

  const currentImages = getCurrentImages()

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options_json]
    newOptions[index] = value
    setFormData({ ...formData, options_json: newOptions })
  }

  const addOption = () => {
    setFormData({
      ...formData,
      options_json: [...formData.options_json, '']
    })
  }

  const removeOption = (index) => {
    const newOptions = formData.options_json.filter((_, i) => i !== index)
    setFormData({ ...formData, options_json: newOptions })
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setSelectedFiles(files)
      // Create preview URLs for all files
      const previews = files.map(file => URL.createObjectURL(file))
      setPreviewUrls(previews)
    }
  }

  const removeSelectedImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = previewUrls.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setPreviewUrls(newPreviews)
  }

  const handleUploadImage = async () => {
    if (selectedFiles.length === 0) return

    setUploadingImage(true)
    const baseUrl = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/api'
    
    try {
      const formDataUpload = new FormData()
      
      // Append all selected files
      selectedFiles.forEach((file, index) => {
        formDataUpload.append('images[]', file)
      })
      formDataUpload.append('question_id', question.id)

      const response = await fetch(`${baseUrl}/questions/${question.id}/upload-images`, {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) throw new Error('Failed to upload images')

      const result = await response.json()
      
      // Update form data with new image URL(s)
      // If single image, store as string; if multiple, store as JSON array string
      setFormData({ ...formData, media_url: result.media_url })
      setSelectedFiles([])
      setPreviewUrls([])
      alert(`${result.count} image(s) uploaded successfully!`)
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload images. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAudioChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedAudio(file)
      // Create preview URL
      const preview = URL.createObjectURL(file)
      setAudioPreview(preview)
    }
  }

  const handleUploadAudio = async () => {
    if (!selectedAudio) return

    setUploadingAudio(true)
    const baseUrl = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/api'
    
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('audio', selectedAudio)
      formDataUpload.append('question_id', question.id)

      const response = await fetch(`${baseUrl}/questions/${question.id}/upload-audio`, {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) throw new Error('Failed to upload audio')

      const result = await response.json()
      
      // Update form data with new audio URL
      setFormData({ ...formData, audio_url: result.audio_url })
      setSelectedAudio(null)
      setAudioPreview(null)
      alert('Audio uploaded successfully!')
    } catch (error) {
      console.error('Error uploading audio:', error)
      alert('Failed to upload audio. Please try again.')
    } finally {
      setUploadingAudio(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave(question.id, formData)
  }

  const getOptionLabel = (index) => {
    return String.fromCharCode(65 + index)
  }

  return (
    <div className="question-editor">
      <form onSubmit={handleSubmit}>
        <div className="editor-header">
          <h3>Edit Question {question.id}</h3>
          <button type="button" className="close-button" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="form-group">
          <label>Question Type:</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="mcq">Multiple Choice</option>
            <option value="image_selection">Image Selection</option>
          </select>
        </div>

        <div className="form-group">
          <label>Question Text:</label>
          <textarea
            value={formData.question_text}
            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label>Images:</label>
          
          {/* Current Images Preview */}
          {currentImages.length > 0 && previewUrls.length === 0 && (
            <div className="current-images-grid">
              <small style={{ gridColumn: '1/-1', marginBottom: '8px', display: 'block' }}>Current Images:</small>
              {currentImages.map((imgUrl, index) => (
                <div key={index} className="current-image-preview">
                  <img 
                    src={getImageUrl(imgUrl)} 
                    alt={`Current ${index + 1}`}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                  <small>Image {index + 1}</small>
                </div>
              ))}
            </div>
          )}

          {/* New Images Preview */}
          {previewUrls.length > 0 && (
            <div className="new-images-grid">
              <small style={{ gridColumn: '1/-1', marginBottom: '8px', display: 'block' }}>New Images Preview:</small>
              {previewUrls.map((preview, index) => (
                <div key={index} className="new-image-preview">
                  <button
                    type="button"
                    className="remove-preview-btn"
                    onClick={() => removeSelectedImage(index)}
                  >
                    ✕
                  </button>
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <small>Image {index + 1}</small>
                </div>
              ))}
            </div>
          )}

          {/* File Upload */}
          <div className="image-upload-section">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              id="image-upload"
              className="file-input"
            />
            <label htmlFor="image-upload" className="file-label">
              📁 Choose Image(s)
            </label>
            
            {selectedFiles.length > 0 && (
              <button
                type="button"
                className="upload-btn"
                onClick={handleUploadImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : `⬆️ Upload ${selectedFiles.length} Image(s)`}
              </button>
            )}
          </div>
          <small style={{ display: 'block', marginTop: '4px', color: '#718096' }}>
            Select multiple images for image selection questions
          </small>

          {/* Manual URL Input (Alternative) */}
          <div className="manual-url-input">
            <small>Or enter URL manually (for JSON array, use format: ["url1","url2"]):</small>
            <textarea
              rows={2}
              value={formData.media_url}
              onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
              placeholder='images/questions/math/session1/q1.png or ["image1.png","image2.png"]'
            />
          </div>
        </div>

        <div className="form-group">
          <label>Answer Options:</label>
          {formData.options_json.map((option, index) => (
            <div key={index} className="option-input-group">
              <span className="option-label-input">{getOptionLabel(index)})</span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${getOptionLabel(index)}`}
                required
              />
              <button
                type="button"
                className="remove-option-btn"
                onClick={() => removeOption(index)}
                disabled={formData.options_json.length <= 2}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="add-option-btn" onClick={addOption}>
            + Add Option
          </button>
        </div>

        <div className="form-group">
          <label>Correct Answer:</label>
          <input
            type="text"
            value={formData.correct_answer}
            onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
            placeholder="Enter the correct answer"
            required
          />
        </div>

        <div className="form-group">
          <label>Audio (Optional):</label>
          
          {/* Current Audio */}
          {formData.audio_url && !audioPreview && (
            <div className="current-audio-preview">
              <audio controls src={getImageUrl(formData.audio_url)}>
                Your browser does not support the audio element.
              </audio>
              <small>Current Audio</small>
            </div>
          )}

          {/* New Audio Preview */}
          {audioPreview && (
            <div className="new-audio-preview">
              <audio controls src={audioPreview}>
                Your browser does not support the audio element.
              </audio>
              <small>New Audio Preview</small>
            </div>
          )}

          {/* Audio Upload */}
          <div className="audio-upload-section">
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              id="audio-upload"
              className="file-input"
            />
            <label htmlFor="audio-upload" className="file-label audio-label">
              🎵 Choose Audio
            </label>
            
            {selectedAudio && (
              <button
                type="button"
                className="upload-btn"
                onClick={handleUploadAudio}
                disabled={uploadingAudio}
              >
                {uploadingAudio ? 'Uploading...' : '⬆️ Upload Audio'}
              </button>
            )}
          </div>

          {/* Manual URL Input (Alternative) */}
          <div className="manual-url-input">
            <small>Or enter audio URL manually:</small>
            <input
              type="text"
              value={formData.audio_url}
              onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
              placeholder="audio/questions/math/session1/q1.mp3"
            />
          </div>
        </div>

        <div className="editor-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="save-btn">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}

export default QuestionEditor
