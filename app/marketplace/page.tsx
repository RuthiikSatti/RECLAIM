import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import CategoryBar from '@/components/marketplace/CategoryBar'
import FiltersRow from '@/components/marketplace/FiltersRow'
import MobileFilterButton from '@/components/marketplace/MobileFilterButton'
import MobileFiltersWrapper from '@/components/marketplace/MobileFiltersWrapper'
import ProductGrid from '@/components/marketplace/ProductGrid'
import DeleteSuccessModal from '@/components/marketplace/DeleteSuccessModal'
import { getCategorySubtitle } from '@/lib/constants/categories'
import type { Listing } from '@/types/database'

/**
 * Marketplace Page - Server Component
 *
 * This is a server component that fetches listings based on URL search params.
 * All filtering happens server-side for better SEO and initial load performance.
 *
 * URL Parameters:
 * - category: Filter by category (e.g., "dorm-and-decor")
 * - radius: Search radius in miles
 * - userLat: User's latitude (for radius filtering)
 * - userLng: User's longitude (for radius filtering)
 * - condition: Filter by listing condition
 * - minPrice: Minimum price
 * - maxPrice: Maximum price
 */

interface MarketplacePageProps {
  searchParams: Promise<{
    category?: string
    radius?: string
    userLat?: string
    userLng?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
  }>
}

// Category configuration
// IMPORTANT: If you need to change category names, update this array
// The 'slug' is used in URLs, 'display' is shown to users
const CATEGORIES = [
  { slug: 'dorm-and-decor', display: 'Dorm & Decor' },
  { slug: 'fun-and-craft', display: 'Fun & Craft' },
  { slug: 'books', display: 'Books' },
  { slug: 'clothing-and-accessories', display: 'Clothing & Accessories' },
  { slug: 'transportation', display: 'Transportation' },
  { slug: 'tech-and-gadgets', display: 'Tech & Gadgets' },
  { slug: 'giveaways', display: 'Giveaways' },
  { slug: 'other', display: 'Other' },
]

// Helper: Convert category slug to display name
function getCategoryDisplay(slug: string | undefined): string {
  if (!slug) return 'all'
  const category = CATEGORIES.find(c => c.slug === slug)
  return category ? category.display : slug
}

// Helper: Convert category slug to database value
// ADJUST THIS if your database uses different category names
function categorySlugToDb(slug: string): string {
  const map: Record<string, string> = {
    'dorm-and-decor': 'Dorm and Decor',
    'fun-and-craft': 'Fun and Craft',
    'books': 'Books',
    'clothing-and-accessories': 'Clothing and Accessories',
    'transportation': 'Transportation',
    'tech-and-gadgets': 'Tech and Gadgets',
    'giveaways': 'Giveaways',
    'other': 'Other'
  }
  return map[slug] || slug
}

async function fetchListings(searchParams: {
  category?: string
  radius?: string
  userLat?: string
  userLng?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
}): Promise<Listing[]> {
  const supabase = await createClient()

  // Parse parameters
  const radius = searchParams.radius ? parseFloat(searchParams.radius) : null
  const userLat = searchParams.userLat ? parseFloat(searchParams.userLat) : null
  const userLng = searchParams.userLng ? parseFloat(searchParams.userLng) : null
  const categorySlug = searchParams.category
  const condition = searchParams.condition
  const minPrice = searchParams.minPrice ? parseFloat(searchParams.minPrice) : null
  const maxPrice = searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : null
  const sort = searchParams.sort || 'relevance'

  try {
    // CASE 1: Radius filtering (requires location)
    if (radius && userLat && userLng) {
      const dbCategory = categorySlug ? categorySlugToDb(categorySlug) : null

      // Call RPC function for radius filtering
      const { data, error } = await supabase.rpc('filter_by_radius', {
        user_lat: userLat,
        user_lng: userLng,
        radius_miles: radius,
        category_filter: dbCategory
      })

      if (error) {
        console.error('Error fetching listings by radius:', error)
        return []
      }

      let filteredData = data || []

      // Apply additional client-side filters
      if (condition) {
        filteredData = filteredData.filter((l: any) => l.condition === condition)
      }
      if (minPrice !== null) {
        filteredData = filteredData.filter((l: any) => l.price >= minPrice)
      }
      if (maxPrice !== null) {
        filteredData = filteredData.filter((l: any) => l.price <= maxPrice)
      }

      // Fetch user data for each listing
      const listingIds = filteredData.map((l: any) => l.id)
      if (listingIds.length > 0) {
        const { data: listingsWithUsers } = await supabase
          .from('listings')
          .select('*, user:users(*)')
          .in('id', listingIds)

        if (listingsWithUsers) {
          // Merge distance data with user data
          let merged = listingsWithUsers.map(listing => {
            const radiusListing = filteredData.find((l: any) => l.id === listing.id)
            return {
              ...listing,
              distance_miles: radiusListing?.distance_miles
            }
          })

          // Apply sorting to merged results
          switch (sort) {
            case 'newest':
              merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              break
            case 'price-asc':
              merged.sort((a, b) => a.price - b.price)
              break
            case 'price-desc':
              merged.sort((a, b) => b.price - a.price)
              break
            case 'relevance':
            default:
              // Relevance: sort by created_at desc (newest first) as default
              merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              break
          }

          return merged as Listing[]
        }
      }

      return filteredData as Listing[]
    }

    // CASE 2: Regular filtering (no radius)
    let query = supabase
      .from('listings')
      .select('*, user:users(*)')

    // Apply category filter
    if (categorySlug) {
      const dbCategory = categorySlugToDb(categorySlug)
      query = query.eq('category', dbCategory)
    }

    // Apply condition filter
    if (condition) {
      query = query.eq('condition', condition)
    }

    // Apply price filters
    if (minPrice !== null) {
      query = query.gte('price', minPrice)
    }
    if (maxPrice !== null) {
      query = query.lte('price', maxPrice)
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'price-asc':
        query = query.order('price', { ascending: true })
        break
      case 'price-desc':
        query = query.order('price', { ascending: false })
        break
      case 'relevance':
      default:
        // Relevance: sort by created_at desc (newest first) as default
        query = query.order('created_at', { ascending: false })
        break
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching listings:', error)
      return []
    }

    return (data as Listing[]) || []
  } catch (err) {
    console.error('Unexpected error fetching listings:', err)
    return []
  }
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams
  const listings = await fetchListings(params)
  const categoryDisplay = getCategoryDisplay(params.category)

  // Generate page title and subtitle
  const pageTitle = params.category
    ? `SHOP ${categoryDisplay.toUpperCase()}`
    : 'SHOP ALL'
  const pageSubtitle = getCategorySubtitle(categoryDisplay)

  return (
    <div className="min-h-screen bg-ume-bg">
      {/* Delete Success Modal */}
      <Suspense fallback={null}>
        <DeleteSuccessModal />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Page Title - Positioned at top */}
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-ume-indigo mb-1">{pageTitle}</h1>
          <p className="text-sm text-gray-600">{pageSubtitle}</p>
        </div>

        {/* Category Bar */}
        <CategoryBar currentCategory={params.category} />

        {/* Mobile Filter Button - Right aligned below categories */}
        <MobileFilterButton />

        {/* Desktop Filters Row */}
        <Suspense fallback={<div className="h-20 bg-white rounded-lg animate-pulse" />}>
          <FiltersRow
            currentCondition={params.condition}
            currentSort={params.sort}
            currentMinPrice={params.minPrice ? (parseFloat(params.minPrice) / 100).toString() : undefined}
            currentMaxPrice={params.maxPrice ? (parseFloat(params.maxPrice) / 100).toString() : undefined}
          />
        </Suspense>

        {/* Mobile Filters - Controlled from MobileHeader */}
        <MobileFiltersWrapper
          currentCondition={params.condition}
          currentSort={params.sort}
          currentMinPrice={params.minPrice ? (parseFloat(params.minPrice) / 100).toString() : undefined}
          currentMaxPrice={params.maxPrice ? (parseFloat(params.maxPrice) / 100).toString() : undefined}
        />

        {/* Listings Count */}
        <div className="mt-4 mb-3 text-sm text-black">
          {listings.length === 0 ? (
            'No listings found'
          ) : (
            `Showing ${listings.length} listing${listings.length === 1 ? '' : 's'}`
          )}
        </div>

        {/* Product Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-10">
            <svg className="mx-auto h-16 w-16 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-black text-lg mt-4">
              No listings match your filters
            </p>
            <p className="text-black text-sm mt-2">
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <ProductGrid listings={listings} />
        )}
      </div>
    </div>
  )
}
