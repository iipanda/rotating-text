import { useState, useCallback } from 'react'
import UPNG from 'upng-js'
import Scene from './components/Scene'
import './App.css'

function App() {
  const [text, setText] = useState('GHOST')
  const [isFocused, setIsFocused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [recordingRotation, setRecordingRotation] = useState(0)

  const renderApng = useCallback(async () => {
    if (isRecording) return
    
    setIsRecording(true)
    setRecordingProgress(0)

    const frames = 60
    const size = 512
    const frameDelay = 50 // ms per frame
    
    const frameDataArray = []
    const delays = []

    // Wait for recording mode to apply
    await new Promise(r => setTimeout(r, 300))

    const canvas = document.querySelector('canvas')
    if (!canvas) {
      console.error('Canvas not found')
      setIsRecording(false)
      return
    }

    // Capture frames
    for (let i = 0; i < frames; i++) {
      const rotation = (i / frames) * Math.PI * 2
      setRecordingRotation(rotation)
      
      // Wait for render
      await new Promise(r => setTimeout(r, 80))
      
      // Capture frame
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = size
      tempCanvas.height = size
      const ctx = tempCanvas.getContext('2d')
      
      // Clear with transparent
      ctx.clearRect(0, 0, size, size)
      
      // Draw the WebGL canvas to temp canvas, centered and scaled
      const srcSize = Math.min(canvas.width, canvas.height)
      const srcX = (canvas.width - srcSize) / 2
      const srcY = (canvas.height - srcSize) / 2
      ctx.drawImage(canvas, srcX, srcY, srcSize, srcSize, 0, 0, size, size)
      
      // Get raw RGBA data
      const imageData = ctx.getImageData(0, 0, size, size)
      frameDataArray.push(imageData.data.buffer)
      delays.push(frameDelay)
      
      setRecordingProgress(Math.round(((i + 1) / frames) * 100))
    }

    // Encode as APNG
    const apngData = UPNG.encode(
      frameDataArray,
      size,
      size,
      0, // 0 = lossless
      delays
    )
    
    // Download
    const blob = new Blob([apngData], { type: 'image/png' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${text || 'logo'}.png`
    a.click()
    URL.revokeObjectURL(url)
    
    setIsRecording(false)
    setRecordingProgress(0)
  }, [isRecording, text])

  return (
    <div className="app">
      <Scene 
        text={text} 
        recording={isRecording}
        recordingRotation={recordingRotation}
      />
      
      {isRecording && <div className="recording-overlay" />}
      
      <button 
        className={`gif-button ${isRecording ? 'recording' : ''}`}
        onClick={renderApng}
        disabled={isRecording}
      >
        {isRecording ? `Rendering... ${recordingProgress}%` : 'Export APNG'}
      </button>
      
      <div className={`input-container ${isFocused ? 'focused' : ''}`}>
        {isFocused ? (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => setIsFocused(false)}
            autoFocus
            maxLength={12}
            placeholder="Enter text..."
          />
        ) : (
          <span 
            className="text-display"
            onClick={() => setIsFocused(true)}
          >
            {text || 'Click to edit'}
          </span>
        )}
      </div>
    </div>
  )
}

export default App
