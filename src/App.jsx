import { useState, useCallback, useRef } from 'react'
import UPNG from 'upng-js'
import GIF from 'gif.js'
import Scene from './components/Scene'
import './App.css'

function App() {
  const [text, setText] = useState('siema')
  const [isFocused, setIsFocused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [recordingRotation, setRecordingRotation] = useState(0)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const boundsRef = useRef({ aspectRatio: 1 })

  const handleBoundsCalculated = useCallback((bounds) => {
    boundsRef.current = bounds
  }, [])

  const captureFrames = async () => {
    const fps = 30
    const durationMs = 3500 // 3.5 seconds
    const frames = Math.round((durationMs / 1000) * fps) // 105 frames
    const frameDelay = Math.round(1000 / fps) // 33ms
    
    const baseHeight = 400
    const aspectRatio = Math.max(1, boundsRef.current.aspectRatio || 1)
    const width = Math.round(baseHeight * aspectRatio * 1.3)
    const height = Math.round(baseHeight * 1.3)
    
    const frameDataArray = []
    const frameCanvases = []
    const delays = []

    await new Promise(r => setTimeout(r, 300))

    const canvas = document.querySelector('canvas')
    if (!canvas) {
      throw new Error('Canvas not found')
    }

    for (let i = 0; i < frames; i++) {
      const rotation = (i / frames) * Math.PI * 2
      setRecordingRotation(rotation)
      
      await new Promise(r => setTimeout(r, 80))
      
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const ctx = tempCanvas.getContext('2d')
      
      ctx.clearRect(0, 0, width, height)
      
      const canvasAspect = canvas.width / canvas.height
      const outputAspect = width / height
      
      let srcX, srcY, srcW, srcH
      
      if (canvasAspect > outputAspect) {
        srcH = canvas.height
        srcW = srcH * outputAspect
        srcX = (canvas.width - srcW) / 2
        srcY = 0
      } else {
        srcW = canvas.width
        srcH = srcW / outputAspect
        srcX = 0
        srcY = (canvas.height - srcH) / 2
      }
      
      ctx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, width, height)
      
      const imageData = ctx.getImageData(0, 0, width, height)
      frameDataArray.push(imageData.data.buffer)
      frameCanvases.push(tempCanvas)
      delays.push(frameDelay)
      
      setRecordingProgress(Math.round(((i + 1) / frames) * 100))
    }

    return { frameDataArray, frameCanvases, delays, width, height }
  }

  const exportApng = useCallback(async () => {
    if (isRecording) return
    
    setIsRecording(true)
    setShowExportMenu(false)
    setRecordingProgress(0)

    try {
      const { frameDataArray, delays, width, height } = await captureFrames()
      
      const apngData = UPNG.encode(frameDataArray, width, height, 0, delays)
      
      const blob = new Blob([apngData], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${text || 'logo'}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
    
    setIsRecording(false)
    setRecordingProgress(0)
  }, [isRecording, text])

  const exportGif = useCallback(async () => {
    if (isRecording) return
    
    setIsRecording(true)
    setShowExportMenu(false)
    setRecordingProgress(0)

    try {
      const { frameCanvases, delays, width, height } = await captureFrames()
      
      const gif = new GIF({
        workers: 2,
        quality: 1,
        width,
        height,
        workerScript: '/gif.worker.js',
        transparent: 0x00ff00
      })

      // Process frames to add green background for transparency
      frameCanvases.forEach((frameCanvas, i) => {
        const ctx = frameCanvas.getContext('2d')
        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data
        
        // Replace transparent pixels with green
        for (let j = 0; j < data.length; j += 4) {
          if (data[j + 3] < 128) {
            data[j] = 0      // R
            data[j + 1] = 255 // G
            data[j + 2] = 0   // B
            data[j + 3] = 255 // A
          }
        }
        
        ctx.putImageData(imageData, 0, 0)
        gif.addFrame(frameCanvas, { delay: delays[i], copy: true })
      })

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
    } catch (err) {
      console.error(err)
      setIsRecording(false)
      setRecordingProgress(0)
    }
  }, [isRecording, text])

  return (
    <div className="app">
      <Scene 
        text={text} 
        recording={isRecording}
        recordingRotation={recordingRotation}
        onBoundsCalculated={handleBoundsCalculated}
      />
      
      <div className="export-container">
        <button 
          className={`export-button ${isRecording ? 'recording' : ''}`}
          onClick={() => !isRecording && setShowExportMenu(!showExportMenu)}
          disabled={isRecording}
        >
          {isRecording ? `Rendering... ${recordingProgress}%` : 'Export ▾'}
        </button>
        
        {showExportMenu && !isRecording && (
          <div className="export-menu">
            <button onClick={exportApng}>APNG (best quality)</button>
            <button onClick={exportGif}>GIF (smaller size)</button>
          </div>
        )}
      </div>
      
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
