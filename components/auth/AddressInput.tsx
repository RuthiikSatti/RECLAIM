'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface AddressInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
  placeholder?: string
  label?: string
}

interface AddressSuggestion {
  place_id: number
  display_name: string
  address: {
    road?: string
    house_number?: string
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
    country?: string
  }
}

/**
 * Address Input Component with US Address Autocomplete
 *
 * Features:
 * - Real-time address suggestions from Nominatim (OpenStreetMap)
 * - US-only address filtering
 * - Debounced API calls (1000ms to respect rate limits)
 * - Keyboard navigation (arrow keys + enter)
 * - Click to select
 */
export default function AddressInput({
  value,
  onChange,
  required = true,
  className = '',
  placeholder = 'Start typing an address...',
  label = 'College Address'
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [hasSelected, setHasSelected] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch address suggestions from Nominatim
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)

    try {
      const encodedQuery = encodeURIComponent(query)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&countrycodes=us&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'UME-Marketplace/1.0 (https://umelife.com)'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data: AddressSuggestion[] = await response.json()
      setSuggestions(data)
      setShowDropdown(data.length > 0)
      setHighlightedIndex(-1)
    } catch (err) {
      console.error('Address suggestion error:', err)
      setSuggestions([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce address fetching (1000ms delay to respect Nominatim rate limits)
  useEffect(() => {
    // Don't fetch if user just selected an address
    if (hasSelected) {
      setHasSelected(false)
      return
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions(value)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [value, fetchSuggestions, hasSelected])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setHasSelected(false)
  }

  // Handle suggestion selection
  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.display_name)
    setHasSelected(true)
    setSuggestions([])
    setShowDropdown(false)
    setHighlightedIndex(-1)
    inputRef.current?.blur()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setHighlightedIndex(-1)
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Format address for display in dropdown
  const formatSuggestionDisplay = (suggestion: AddressSuggestion): { main: string; secondary: string } => {
    const addr = suggestion.address
    const parts: string[] = []

    // Main text: street address
    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`)
    } else if (addr.road) {
      parts.push(addr.road)
    }

    const main = parts.length > 0 ? parts.join(' ') : suggestion.display_name.split(',')[0]

    // Secondary text: city, state, zip
    const secondaryParts: string[] = []
    const city = addr.city || addr.town || addr.village
    if (city) secondaryParts.push(city)
    if (addr.state) secondaryParts.push(addr.state)
    if (addr.postcode) secondaryParts.push(addr.postcode)

    const secondary = secondaryParts.join(', ')

    return { main, secondary }
  }

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="collegeAddress" className="block text-sm font-medium text-black mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="collegeAddress"
          name="collegeAddress"
          type="text"
          required={required}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && !hasSelected) {
              setShowDropdown(true)
            }
          }}
          className="appearance-none rounded-full relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-400 text-black focus:outline-none focus:ring-black focus:border-black"
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {isLoading && (
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading suggestions"
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
          )}
        </div>
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => {
            const { main, secondary } = formatSuggestionDisplay(suggestion)
            const isHighlighted = index === highlightedIndex

            return (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-3 text-left transition-colors ${
                  isHighlighted ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                role="option"
                aria-selected={isHighlighted}
              >
                <div className="font-medium text-black text-sm">{main}</div>
                {secondary && (
                  <div className="text-xs text-gray-500 mt-0.5">{secondary}</div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Helper text */}
      <p className="mt-1 text-xs text-gray-500">
        Start typing and select from suggestions (US addresses only)
      </p>
    </div>
  )
}
