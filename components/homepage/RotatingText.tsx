'use client'

import { useState, useEffect } from 'react'

const messages = [
  'Real-time chat',
  'Safe and simple',
  'Verified students only'
]

export default function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setFade(false)

      // After fade out completes, change text and fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length)
        setFade(true)
      }, 300) // Half of transition duration for smooth effect
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-8 flex items-center justify-center">
      <span
        className={`absolute text-xl font-bold text-black transition-opacity duration-500 ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ willChange: 'opacity' }}
      >
        {messages[currentIndex]}
      </span>
    </div>
  )
}
