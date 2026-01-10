import { useState, useRef, useCallback, useEffect } from 'react'
import GIF from 'gif.js'
import Scene from './components/Scene'
import './App.css'

function App() {
  const [text, setText] = useState('GHOST')
  const [isFocused, setIsFocused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [recordingRotation, setRecordingRotation] = useState(0)
  const sceneRef = useRef()

  const renderGif = useCallback(async () => {
    if (isRecording) return
    
    setIsRecording(true)
    setRecordingProgress(0)

    const frames = 60
    const size = 512
    
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: size,
      height: size,
      workerScript: '/gif.worker.js',
      transparent: 0x000000
    })

    // Wait for recording mode to apply
    await new Promise(r => setTimeout(r, 200))

    // Find the canvas element
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
      await new Promise(r => setTimeout(r, 60))
      
      // Capture frame
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = size
      tempCanvas.height = size
      const ctx = tempCanvas.getContext('2d')
      
      // Draw the WebGL canvas to temp canvas, centered and scaled
      const srcSize = Math.min(canvas.width, canvas.height)
      const srcX = (canvas.width - srcSize) / 2
      const srcY = (canvas.height - srcSize) / 2
      ctx.drawImage(canvas, srcX, srcY, srcSize, srcSize, 0, 0, size, size)
      
      gif.addFrame(tempCanvas, { delay: 50, copy: true })
      setRecordingProgress(Math.round(((i + 1) / frames) * 100))
    }

    gif.on('finished', (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${text || 'logo'}.gif`
      a.click()
      URL.revokeObjectURL(url)
      setIsRecording(false)
      setRecordingProgress(0)
    })

    gif.render()
  }, [isRecording, text])

  return (
    <div className="app">
      <Scene 
        ref={sceneRef}
        text={text} 
        recording={isRecording}
        recordingRotation={recordingRotation}
      />
      
      <button 
        className={`gif-button ${isRecording ? 'recording' : ''}`}
        onClick={renderGif}
        disabled={isRecording}
      >
        {isRecording ? `Rendering... ${recordingProgress}%` : 'Export GIF'}
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
