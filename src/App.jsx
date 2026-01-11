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
  const [showSettings, setShowSettings] = useState(false)
  const boundsRef = useRef({ aspectRatio: 1 })

  // Default settings
  const defaultSettings = {
    rotationDuration: 7,
    bevelType: 'rounded',
    lightIntensity: 5,
    bloomIntensity: 0.15,
    bloomThreshold: 0.15,
    alwaysReadable: false,
    bounceBack: false,
    color: '#ff4400',
    font: 'inter',
    material: 'metallic',
  }

  // Material presets
  const materialPresets = {
    metallic: { metalness: 1, roughness: 0.15, envMapIntensity: 1.5 },
    chrome: { metalness: 1, roughness: 0.05, envMapIntensity: 2 },
    matte: { metalness: 0.1, roughness: 0.8, envMapIntensity: 0.5 },
    plastic: { metalness: 0.2, roughness: 0.4, envMapIntensity: 0.8 },
    glass: { metalness: 0.1, roughness: 0.05, envMapIntensity: 3, transparent: true, opacity: 0.4 },
    brushed: { metalness: 0.8, roughness: 0.4, envMapIntensity: 1 },
    metal: { metalness: 0.3, roughness: 0.5, envMapIntensity: 0.3, texture: 'metal' },
    wood: { metalness: 0.0, roughness: 0.8, envMapIntensity: 0.1, texture: 'wood' },
    grass: { metalness: 0.0, roughness: 0.9, envMapIntensity: 0.1, texture: 'grass' },
    marble: { metalness: 0.1, roughness: 0.4, envMapIntensity: 0.2, texture: 'marble' },
    lava: { metalness: 0.0, roughness: 0.7, envMapIntensity: 0.1, texture: 'lava' },
    leather: { metalness: 0.0, roughness: 0.8, envMapIntensity: 0.1, texture: 'leather' },
    rust: { metalness: 0.2, roughness: 0.7, envMapIntensity: 0.2, texture: 'rust' },
    concrete: { metalness: 0.0, roughness: 0.9, envMapIntensity: 0.1, texture: 'concrete' },
  }

  // Font options
  const fontOptions = ['inter', 'bebas', 'roboto', 'montserrat', 'oswald']

  // Settings
  const [settings, setSettings] = useState(defaultSettings)

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  const randomizeSettings = () => {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    const randomFont = fontOptions[Math.floor(Math.random() * fontOptions.length)]
    const materialKeys = Object.keys(materialPresets)
    const randomMaterial = materialKeys[Math.floor(Math.random() * materialKeys.length)]
    
    setSettings(prev => ({
      ...prev,
      color: randomColor,
      font: randomFont,
      material: randomMaterial,
      bevelType: Math.random() > 0.5 ? 'rounded' : 'chamfer',
    }))
  }

  const handleBoundsCalculated = useCallback((bounds) => {
    boundsRef.current = bounds
  }, [])

  const captureFrames = useCallback(async () => {
    const fps = 30
    const durationMs = settings.rotationDuration * 1000
    const frames = Math.round((durationMs / 1000) * fps)
    const frameDelay = Math.round(1000 / fps)
    
    const baseSize = 400
    const aspectRatio = Math.max(1, boundsRef.current.aspectRatio || 1)
    const width = Math.round(baseSize * aspectRatio * 1.05)
    const height = Math.round(baseSize * 1.05)
    
    const frameDataArray = []
    const frameCanvases = []
    const delays = []

    await new Promise(r => setTimeout(r, 300))

    const canvas = document.querySelector('canvas')
    if (!canvas) {
      throw new Error('Canvas not found')
    }

    for (let i = 0; i < frames; i++) {
      let rotation
      if (settings.bounceBack) {
        // Bounce: 0 -> PI/2 -> 0 -> -PI/2 -> 0 with smooth easing
        const t = i / frames
        rotation = (Math.PI / 2) * Math.sin(t * Math.PI * 2)
      } else {
        rotation = (i / frames) * Math.PI * 2
      }
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
  }, [settings.rotationDuration, settings.bounceBack])

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
  }, [isRecording, text, captureFrames])

  const exportGif = useCallback(async () => {
    if (isRecording) return
    
    setIsRecording(true)
    setShowExportMenu(false)
    setRecordingProgress(0)

    try {
      const { frameCanvases, delays, width, height } = await captureFrames()
      
      const TRANSPARENT_KEY = 0x00ff00
      const keyR = 0
      const keyG = 255
      const keyB = 0
      // Higher = more edge pixels become fully transparent (less fringe, more cut-off)
      const alphaCutoff = 230
      const cropPadding = 8

      let minX = width
      let minY = height
      let maxX = -1
      let maxY = -1

      frameCanvases.forEach((frameCanvas) => {
        const ctx = frameCanvas.getContext('2d')
        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data
        
        for (let y = 0; y < height; y++) {
          const rowOffset = y * width * 4
          for (let x = 0; x < width; x++) {
            const idx = rowOffset + x * 4
            const alpha = data[idx + 3]

            if (alpha >= alphaCutoff) {
              if (x < minX) minX = x
              if (y < minY) minY = y
              if (x > maxX) maxX = x
              if (y > maxY) maxY = y
            }

            if (alpha === 255) continue

            // Convert all non-opaque pixels to either:
            // - fully transparent (via chroma key), or
            // - fully opaque composited onto black
            if (alpha === 0 || alpha < alphaCutoff) {
              data[idx] = keyR
              data[idx + 1] = keyG
              data[idx + 2] = keyB
              data[idx + 3] = 255
              continue
            }

            const a = alpha / 255
            data[idx] = Math.round(data[idx] * a)
            data[idx + 1] = Math.round(data[idx + 1] * a)
            data[idx + 2] = Math.round(data[idx + 2] * a)
            data[idx + 3] = 255
          }
        }
        
        ctx.putImageData(imageData, 0, 0)
      })

      let cropX = 0
      let cropY = 0
      let cropW = width
      let cropH = height

      if (maxX >= 0 && maxY >= 0) {
        cropX = Math.max(0, minX - cropPadding)
        cropY = Math.max(0, minY - cropPadding)
        cropW = Math.min(width, maxX + cropPadding + 1) - cropX
        cropH = Math.min(height, maxY + cropPadding + 1) - cropY
      }

      const gif = new GIF({
        workers: 2,
        quality: 1,
        width: cropW,
        height: cropH,
        workerScript: '/gif.worker.js',
        transparent: TRANSPARENT_KEY,
        globalPalette: true
      })

      const croppedCanvas = document.createElement('canvas')
      croppedCanvas.width = cropW
      croppedCanvas.height = cropH
      const croppedCtx = croppedCanvas.getContext('2d')

      frameCanvases.forEach((frameCanvas, i) => {
        croppedCtx.clearRect(0, 0, cropW, cropH)
        croppedCtx.drawImage(frameCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
        gif.addFrame(croppedCanvas, { delay: delays[i], copy: true })
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
  }, [isRecording, text, captureFrames])

  return (
    <div className="app">
      <Scene 
        text={text} 
        recording={isRecording}
        recordingRotation={recordingRotation}
        onBoundsCalculated={handleBoundsCalculated}
        settings={settings}
        materialPresets={materialPresets}
      />
      
      <div className="top-controls">
        <button 
          className={`control-button ${showSettings ? 'active' : ''}`}
          onClick={() => {
            setShowSettings(!showSettings)
            if (!showSettings) setShowExportMenu(false)
          }}
        >
          ⚙
        </button>
        
        <div className="export-container">
          <button 
            className={`export-button ${isRecording ? 'recording' : ''}`}
            onClick={() => {
              if (isRecording) return
              setShowExportMenu(!showExportMenu)
              if (!showExportMenu) setShowSettings(false)
            }}
            disabled={isRecording}
          >
            {isRecording ? `${recordingProgress}%` : 'Export ▾'}
          </button>
          
          {showExportMenu && !isRecording && (
            <div className="export-menu">
              <button onClick={exportApng}>APNG</button>
              <button onClick={exportGif}>GIF</button>
            </div>
          )}
        </div>
      </div>
      
      {showSettings && (
        <div className="settings-panel">
          <div className="setting-row">
            <label>Duration</label>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={settings.rotationDuration}
              onChange={(e) => updateSetting('rotationDuration', parseFloat(e.target.value))}
            />
            <span>{settings.rotationDuration}s</span>
          </div>

          <div className="setting-row">
            <label>Fake rotate</label>
            <input
              type="checkbox"
              checked={settings.alwaysReadable}
              onChange={(e) => {
                updateSetting('alwaysReadable', e.target.checked)
                if (e.target.checked) updateSetting('bounceBack', false)
              }}
            />
          </div>

          <div className="setting-row">
            <label>Bounce back</label>
            <input
              type="checkbox"
              checked={settings.bounceBack}
              onChange={(e) => {
                updateSetting('bounceBack', e.target.checked)
                if (e.target.checked) updateSetting('alwaysReadable', false)
              }}
            />
          </div>
          
          <div className="setting-row">
            <label>Light</label>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={settings.lightIntensity}
              onChange={(e) => updateSetting('lightIntensity', parseFloat(e.target.value))}
            />
            <span>{settings.lightIntensity}</span>
          </div>
          
          <div className="setting-row">
            <label>Bloom</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.bloomIntensity}
              onChange={(e) => updateSetting('bloomIntensity', parseFloat(e.target.value))}
            />
            <span>{settings.bloomIntensity.toFixed(2)}</span>
          </div>
          
          <div className="setting-row">
            <label>Threshold</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.bloomThreshold}
              onChange={(e) => updateSetting('bloomThreshold', parseFloat(e.target.value))}
            />
            <span>{settings.bloomThreshold.toFixed(2)}</span>
          </div>

          <div className="settings-divider" />

          {!materialPresets[settings.material]?.texture && (
            <div className="setting-row">
              <label>Color</label>
              <input
                type="color"
                value={settings.color}
                onChange={(e) => updateSetting('color', e.target.value)}
              />
            </div>
          )}

          <div className="setting-row">
            <label>Font</label>
            <select
              value={settings.font}
              onChange={(e) => updateSetting('font', e.target.value)}
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font.charAt(0).toUpperCase() + font.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="setting-row">
            <label>Material</label>
            <select
              value={settings.material}
              onChange={(e) => updateSetting('material', e.target.value)}
            >
              {Object.keys(materialPresets).map(mat => (
                <option key={mat} value={mat}>{mat.charAt(0).toUpperCase() + mat.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="setting-row">
            <label>Bevel</label>
            <select
              value={settings.bevelType}
              onChange={(e) => updateSetting('bevelType', e.target.value)}
            >
              <option value="chamfer">Chamfer</option>
              <option value="rounded">Rounded</option>
            </select>
          </div>

          <div className="settings-divider" />

          <div className="settings-buttons">
            <button className="settings-btn" onClick={randomizeSettings}>Randomize</button>
            <button className="settings-btn" onClick={resetSettings}>Reset</button>
          </div>
        </div>
      )}
      
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
          <div className="text-display-wrapper" onClick={() => setIsFocused(true)}>
            <span className="text-hint">click to edit text</span>
            <span className="text-display">{text || 'LOGO'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
