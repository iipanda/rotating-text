import { useState } from 'react'
import Scene from './components/Scene'
import './App.css'

function App() {
  const [text, setText] = useState('GHOST')
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="app">
      <Scene text={text} />
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
