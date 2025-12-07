'use client'

/**
 * HeaderSearch Component
 *
 * Slide-down search dialog from header with keyboard navigation
 * Features:
 * - Debounced search (300ms)
 * - Supabase query on listings (title, description, category)
 * - Up to 6 results with thumbnail, title, price
 * - Keyboard accessible (arrow nav, Enter, ESC)
 * - Click outside to close
 * - Autofocus on open
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/types/database'
import SearchResultItem from './SearchResultItem'

interface HeaderSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function HeaderSearch({ open, onOpenChange }: HeaderSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search function
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true)

        // Query Supabase for matching listings
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
        }
      } catch (err) {
        console.error('Search exception:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [query, supabase])

  // Autofocus when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    } else {
      // Clear query when closing
      setQuery('')
      setResults([])
    }
  }, [open])

  // Handle selecting a result
  const handleSelect = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Handle Enter key on empty selection - navigate to full search page
  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query)}`)
      onOpenChange(false)
    }
  }, [query, router, onOpenChange])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 z-50 animate-in fade-in" />
        <Dialog.Content
          className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50 animate-in slide-in-from-top duration-300"
          onEscapeKeyDown={() => onOpenChange(false)}
        >
          <Dialog.Title className="sr-only">Search Listings</Dialog.Title>
          <div className="max-w-2xl mx-auto px-6 py-6">
            <Command className="rounded-lg border border-gray-200 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center border-b border-gray-200 px-4">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mr-2" />
                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search"
                  className="flex-1 py-3 outline-none text-sm placeholder-gray-400 bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && results.length === 0) {
                      handleSearchSubmit()
                    }
                  }}
                />
                {loading && (
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-black rounded-full" />
                )}
              </div>

              {/* Results */}
              <Command.List className="max-h-[400px] overflow-y-auto">
                {query.trim() && !loading && results.length === 0 && (
                  <Command.Empty className="px-4 py-8 text-center text-sm text-gray-500">
                    No results found. Press Enter to search all listings.
                  </Command.Empty>
                )}

                {results.length > 0 && (
                  <Command.Group className="py-2">
                    {results.map((listing) => (
                      <Command.Item
                        key={listing.id}
                        value={listing.id}
                        onSelect={() => {
                          router.push(`/item/${listing.id}`)
                          handleSelect()
                        }}
                        className="cursor-pointer"
                      >
                        <SearchResultItem listing={listing} onSelect={handleSelect} />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {results.length > 0 && (
                  <div className="border-t border-gray-200 px-4 py-3">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View all results for "{query}"
                    </button>
                  </div>
                )}
              </Command.List>
            </Command>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
