'use client'

/**
 * Search Page
 *
 * Full search results page with pagination
 * Reads query param and displays paginated results
 */

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/types/database'
import ListingCard from '@/components/listings/ListingCard'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('query') || ''
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const supabase = createClient()
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    async function fetchResults() {
      if (!query.trim()) {
        setListings([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        const from = (page - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        // Query Supabase for matching listings with pagination
        const { data, error, count } = await supabase
          .from('listings')
          .select('*', { count: 'exact' })
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .range(from, to)

        if (error) {
          console.error('Search error:', error)
          setListings([])
        } else {
          setListings(data || [])
          setHasMore(count ? count > to + 1 : false)
        }
      } catch (err) {
        console.error('Search exception:', err)
        setListings([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query, page, supabase])

  // Reset page when query changes
  useEffect(() => {
    setPage(1)
  }, [query])

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-black mb-4">Search Listings</h1>
          <p className="text-gray-600">Enter a search query to find listings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Search Results
          </h1>
          <p className="text-gray-600">
            Showing results for "{query}"
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-black rounded-full" />
          </div>
        )}

        {/* No Results */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">
              No listings found for "{query}"
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Try different keywords or browse all listings
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && listings.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {page}
              </span>

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-black rounded-full" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
