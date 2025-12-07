'use client'

/**
 * HeaderInlineSearch Component
 *
 * Minimal inline dropdown search that appears directly under the header search icon.
 * No modal, no overlay, no blur - just a clean dropdown.
 *
 * Features:
 * - Appears absolutely positioned under search icon
 * - Debounced search (300ms)
 * - Keyboard navigation (arrows, Enter, ESC)
 * - Click outside to close
 * - Up to 6 results
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/types/database'

interface HeaderInlineSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function HeaderInlineSearch({ isOpen, onClose }: HeaderInlineSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Autofocus when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0)
      setQuery('')
      setResults([])
      setSelectedIndex(-1)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(-1)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .limit(6)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Search error:', error)
          setResults([])
        } else {
          setResults(data || [])
          setSelectedIndex(-1)
        }
      } catch (err) {
        console.error('Search exception:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, supabase])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()

      if (selectedIndex >= 0 && results[selectedIndex]) {
        // Navigate to selected item
        router.push(`/item/${results[selectedIndex].id}`)
        onClose()
      } else if (query.trim()) {
        // Navigate to full search page
        router.push(`/search?query=${encodeURIComponent(query)}`)
        onClose()
      }
    }
  }, [selectedIndex, results, query, router, onClose])

  const handleResultClick = useCallback((listingId: string) => {
    router.push(`/item/${listingId}`)
    onClose()
  }, [router, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
      onKeyDown={handleKeyDown}
    >
      {/* Search Input */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="flex-1 outline-none text-sm placeholder-gray-400 border-b border-gray-300 pb-1"
        />
        {loading && (
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-black rounded-full ml-2" />
        )}
      </div>

      {/* Results */}
      <div className="max-h-96 overflow-y-auto">
        {query.trim() && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No results found. Press Enter to search all listings.
          </div>
        )}

        {results.length > 0 && (
          <div className="py-2">
            {results.map((listing, index) => {
              const imageUrl = listing.image_urls?.[0] || '/placeholder.png'
              const priceFormatted = `$${(listing.price / 100).toFixed(2)}`
              const isSelected = index === selectedIndex

              return (
                <div
                  key={listing.id}
                  onClick={() => handleResultClick(listing.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title and Category */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate">
                      {listing.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {listing.category}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0">
                    <p className="text-sm font-semibold text-black">
                      {priceFormatted}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {results.length > 0 && query.trim() && (
          <div className="border-t border-gray-200 px-4 py-3">
            <button
              onClick={() => {
                router.push(`/search?query=${encodeURIComponent(query)}`)
                onClose()
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              View all results for "{query}"
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
