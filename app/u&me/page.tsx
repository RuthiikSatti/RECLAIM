'use client'

import { useState } from 'react'

export default function ValentinePage() {
  const [yesSize, setYesSize] = useState(1.2)
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 })
  const [celebrated, setCelebrated] = useState(false)
  const [noButtonStyle, setNoButtonStyle] = useState<React.CSSProperties>({})

  const makeYesBigger = () => {
    const newSize = yesSize + 0.5
    setYesSize(newSize)

    // Move the "No" button randomly
    const x = Math.random() * (window.innerWidth - 150)
    const y = Math.random() * (window.innerHeight - 100)
    setNoPosition({ x, y })
    setNoButtonStyle({
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
    })
  }

  const celebrate = () => {
    setCelebrated(true)
  }

  if (celebrated) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          margin: 0,
          backgroundColor: '#fff0f3',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#ff4d6d', fontSize: '2.5rem' }}>
          I knew you'd say yes!
        </h1>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        margin: 0,
        backgroundColor: '#fff0f3',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        textAlign: 'center',
      }}
    >
      <h1 style={{ color: '#ff4d6d', fontSize: '2.5rem', marginBottom: '20px' }}>
        Bryndís, will you be my Valentine?
      </h1>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
        <button
          id="yesBtn"
          onClick={celebrate}
          style={{
            backgroundColor: '#ff4d6d',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '1.2rem',
            borderRadius: '50px',
            cursor: 'pointer',
            transition: '0.3s',
            boxShadow: '0 4px 15px rgba(255, 77, 109, 0.3)',
            transform: `scale(${yesSize})`,
          }}
        >
          YES
        </button>
        <button
          id="noBtn"
          onMouseOver={makeYesBigger}
          onClick={makeYesBigger}
          style={{
            backgroundColor: '#adb5bd',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '1.2rem',
            borderRadius: '50px',
            cursor: 'pointer',
            ...noButtonStyle,
          }}
        >
          No
        </button>
      </div>
    </div>
  )
}
