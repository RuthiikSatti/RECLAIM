'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import ListingCard from '@/components/listings/ListingCard'
import EnhancedSearchFilter from '@/components/listings/EnhancedSearchFilter'
import { applyFiltersAndSort } from '@/lib/utils/listingFilters'
import type { Listing } from '@/types/database'
import type { FilterOptions, SortConfig } from '@/lib/utils/listingFilters'

function MarketplaceContent() {
  const searchParams = useSearchParams()
  const [supabase] = useState(() => createClient())
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter and sort state
  const [filters, setFilters] = useState<FilterOptions>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    option: 'newest',
    direction: 'desc'
  })

  // Initialize search from URL parameter
  useEffect(() => {
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      setFilters(prev => ({ ...prev, search: searchQuery }))
    }
  }, [searchParams])

  // Fetch all listings on mount
  useEffect(() => {
    let mounted = true

    async function fetchListings() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('listings')
          .select('*, user:users(*)')
          .order('created_at', { ascending: false })

        if (!mounted) return

        if (fetchError) {
          console.error('Error fetching listings:', fetchError)
          setError('Failed to load listings. Please try again.')
          setListings([])
        } else {
          setListings((data as Listing[]) || [])
        }
      } catch (err: any) {
        if (!mounted) return
        console.error('Error fetching listings:', err)
        setError('Failed to load listings. Please try again.')
        setListings([])
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchListings()

    return () => {
      mounted = false
    }
  }, [supabase])

  // Apply filters and sorting using utility function
  const filteredAndSortedListings = useMemo(() => {
    return applyFiltersAndSort(listings, filters, sortConfig)
  }, [listings, filters, sortConfig])

  // Handle filter changes from EnhancedSearchFilter
  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  // Handle sort changes from EnhancedSearchFilter
  const handleSortChange = (newSortConfig: SortConfig) => {
    setSortConfig(newSortConfig)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-4">Marketplace</h1>

          {/* Enhanced Search and Filter Component */}
          <EnhancedSearchFilter
            allListings={listings}
            filters={filters}
            sortConfig={sortConfig}
            onFiltersChange={handleFiltersChange}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading listings...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAndSortedListings.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-600 text-lg mt-4">
              {listings.length === 0 ? 'No listings available yet.' : 'No listings match your filters.'}
            </p>
            {listings.length > 0 && (
              <button
                onClick={() => setFilters({})}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {!loading && !error && filteredAndSortedListings.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredAndSortedListings.length} of {listings.length} listings
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading marketplace...</p>
          </div>
        </div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  )
}
