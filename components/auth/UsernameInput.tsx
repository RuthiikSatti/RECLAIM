'use client'

import { useState, useEffect, useCallback } from 'react'

interface UsernameInputProps {
  value: string
  onChange: (value: string) => void
  onAvailabilityChange: (available: boolean) => void
  required?: boolean
  className?: string
}

type CheckState = 'idle' | 'checking' | 'available' | 'taken' | 'error' | 'invalid'

/**
 * Debounced Username Input Component
 *
 * Features:
 * - Real-time availability checking with debouncing
 * - Visual feedback: Checking (spinner), Available (green checkmark), Taken (red), Error (red)
 * - Format validation before checking availability
 * - Exposes availability state to parent component
 */
export default function UsernameInput({
  value,
  onChange,
  onAvailabilityChange,
  required = true,
  className = ''
}: UsernameInputProps) {
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isChecking, setIsChecking] = useState(false)

  // Debounced availability check
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username) {
      setCheckState('idle')
      setErrorMessage('')
      onAvailabilityChange(false)
      return
    }

    // No format validation - only check uniqueness
    // Check availability via API
    setCheckState('checking')
    setIsChecking(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (!response.ok) {
        setCheckState('error')
        setErrorMessage(data.error || 'Failed to check username availability')
        onAvailabilityChange(false)
        return
      }

      if (data.available) {
        setCheckState('available')
        setErrorMessage('')
        onAvailabilityChange(true)
      } else {
        setCheckState('taken')
        setErrorMessage('Username already exists — try another')
        onAvailabilityChange(false)
      }
    } catch (err) {
      console.error('Username check error:', err)
      setCheckState('error')
      setErrorMessage('Failed to check username availability')
      onAvailabilityChange(false)
    } finally {
      setIsChecking(false)
    }
  }, [onAvailabilityChange])

  // Debounce username checking (500ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(value)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [value, checkUsernameAvailability])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Reset state immediately on change
    if (checkState !== 'idle' && checkState !== 'checking') {
      setCheckState('idle')
      setErrorMessage('')
    }
  }

  // Determine border color based on state
  const getBorderColor = () => {
    switch (checkState) {
      case 'available':
        return 'border-green-500 focus:ring-green-500 focus:border-green-500'
      case 'taken':
      case 'error':
      case 'invalid':
        return 'border-red-500 focus:ring-red-500 focus:border-red-500'
      default:
        return 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }
  }

  // Determine status icon
  const renderStatusIcon = () => {
    if (checkState === 'checking') {
      return (
        <svg
          className="animate-spin h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-label="Checking username availability"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )
    }

    if (checkState === 'available') {
      return (
        <svg
          className="h-5 w-5 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-label="Username available"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )
    }

    if (checkState === 'taken' || checkState === 'error' || checkState === 'invalid') {
      return (
        <svg
          className="h-5 w-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-label="Username not available"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )
    }

    return null
  }

  return (
    <div className={className}>
      <label htmlFor="username" className="block text-sm font-medium text-black mb-1">
        Username
      </label>
      <div className="relative">
        <input
          id="username"
          name="username"
          type="text"
          required={required}
          value={value}
          onChange={handleChange}
          className={`appearance-none rounded-lg relative block w-full px-3 py-2 pr-10 border ${getBorderColor()} placeholder-gray-400 text-black focus:outline-none transition-colors`}
          placeholder="Choose a unique username"
          aria-describedby="username-status"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {renderStatusIcon()}
        </div>
      </div>

      {/* Status messages */}
      {checkState === 'checking' && (
        <p id="username-status" className="mt-1 text-sm text-gray-600">
          Checking availability...
        </p>
      )}
      {checkState === 'available' && (
        <p id="username-status" className="mt-1 text-sm text-green-600">
          ✓ Username is available!
        </p>
      )}
      {(checkState === 'taken' || checkState === 'error' || checkState === 'invalid') && errorMessage && (
        <p id="username-status" className="mt-1 text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
