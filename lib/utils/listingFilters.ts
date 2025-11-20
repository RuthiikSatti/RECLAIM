/**
 * Listing Filters and Sorting Utilities
 *
 * Provides reusable functions for filtering and sorting marketplace listings
 * based on various criteria including condition, features, seller rating, and price.
 */

import type { Listing, ListingCondition } from '@/types/database'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type SortOption =
  | 'newest'
  | 'price_low'
  | 'price_high'
  | 'condition'
  | 'seller_rating'
  | 'features'

export interface FilterOptions {
  search?: string
  category?: string
  conditions?: ListingCondition[]
  minPrice?: number
  maxPrice?: number
  sellerRating?: number // Minimum rating (e.g., 4 for 4★+)
  features?: string[]
  brands?: string[]
  colors?: string[]
  sizes?: string[]
  materials?: string[]
}

export interface SortConfig {
  option: SortOption
  direction?: 'asc' | 'desc'
}

// ============================================================================
// CONDITION RANKING
// ============================================================================

const CONDITION_RANK: Record<ListingCondition, number> = {
  'New': 4,
  'Like New': 3,
  'Used': 2,
  'Refurbished': 1
}

// ============================================================================
// FILTERING FUNCTIONS
// ============================================================================

/**
 * Apply search filter (title and description)
 */
function applySearchFilter(listings: Listing[], search: string): Listing[] {
  if (!search) return listings

  const searchLower = search.toLowerCase()
  return listings.filter(listing =>
    listing.title.toLowerCase().includes(searchLower) ||
    listing.description.toLowerCase().includes(searchLower)
  )
}

/**
 * Apply category filter
 */
function applyCategoryFilter(listings: Listing[], category?: string): Listing[] {
  if (!category || category === 'All') return listings
  return listings.filter(listing => listing.category === category)
}

/**
 * Apply condition filter
 */
function applyConditionFilter(listings: Listing[], conditions?: ListingCondition[]): Listing[] {
  if (!conditions || conditions.length === 0) return listings
  return listings.filter(listing =>
    listing.condition && conditions.includes(listing.condition)
  )
}

/**
 * Apply price range filter
 */
function applyPriceFilter(
  listings: Listing[],
  minPrice?: number,
  maxPrice?: number
): Listing[] {
  return listings.filter(listing => {
    if (minPrice !== undefined && listing.price < minPrice) return false
    if (maxPrice !== undefined && listing.price > maxPrice) return false
    return true
  })
}

/**
 * Apply seller rating filter
 */
function applySellerRatingFilter(listings: Listing[], minRating?: number): Listing[] {
  if (!minRating) return listings
  return listings.filter(listing =>
    listing.user?.seller_rating && listing.user.seller_rating >= minRating
  )
}

// Verified sellers filter removed - no longer needed

/**
 * Apply features filter (must have ALL selected features)
 */
function applyFeaturesFilter(listings: Listing[], features?: string[]): Listing[] {
  if (!features || features.length === 0) return listings
  return listings.filter(listing =>
    listing.features &&
    features.every(feature => listing.features!.includes(feature))
  )
}

/**
 * Apply brand filter
 */
function applyBrandFilter(listings: Listing[], brands?: string[]): Listing[] {
  if (!brands || brands.length === 0) return listings
  return listings.filter(listing =>
    listing.brand && brands.includes(listing.brand)
  )
}

/**
 * Apply color filter
 */
function applyColorFilter(listings: Listing[], colors?: string[]): Listing[] {
  if (!colors || colors.length === 0) return listings
  return listings.filter(listing =>
    listing.color && colors.includes(listing.color)
  )
}

/**
 * Apply size filter
 */
function applySizeFilter(listings: Listing[], sizes?: string[]): Listing[] {
  if (!sizes || sizes.length === 0) return listings
  return listings.filter(listing =>
    listing.size && sizes.includes(listing.size)
  )
}

/**
 * Apply material filter
 */
function applyMaterialFilter(listings: Listing[], materials?: string[]): Listing[] {
  if (!materials || materials.length === 0) return listings
  return listings.filter(listing =>
    listing.material && materials.includes(listing.material)
  )
}

// ============================================================================
// SORTING FUNCTIONS
// ============================================================================

/**
 * Sort by newest first
 */
function sortByNewest(listings: Listing[]): Listing[] {
  return [...listings].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

/**
 * Sort by price
 */
function sortByPrice(listings: Listing[], direction: 'asc' | 'desc'): Listing[] {
  return [...listings].sort((a, b) =>
    direction === 'asc' ? a.price - b.price : b.price - a.price
  )
}

/**
 * Sort by condition (New → Like New → Used → Refurbished)
 */
function sortByCondition(listings: Listing[]): Listing[] {
  return [...listings].sort((a, b) => {
    const rankA = a.condition ? CONDITION_RANK[a.condition] : 0
    const rankB = b.condition ? CONDITION_RANK[b.condition] : 0
    return rankB - rankA // Higher rank first
  })
}

/**
 * Sort by seller rating (highest first)
 */
function sortBySellerRating(listings: Listing[]): Listing[] {
  return [...listings].sort((a, b) => {
    const ratingA = a.user?.seller_rating || 0
    const ratingB = b.user?.seller_rating || 0
    return ratingB - ratingA
  })
}

/**
 * Sort by features (items with more features first)
 */
function sortByFeatures(listings: Listing[]): Listing[] {
  return [...listings].sort((a, b) => {
    const featuresA = a.features?.length || 0
    const featuresB = b.features?.length || 0
    return featuresB - featuresA
  })
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Apply all filters to listings (AND logic - all must match)
 */
export function applyFilters(
  listings: Listing[],
  filters: FilterOptions
): Listing[] {
  let filtered = listings

  // Apply each filter sequentially
  filtered = applySearchFilter(filtered, filters.search || '')
  filtered = applyCategoryFilter(filtered, filters.category)
  filtered = applyConditionFilter(filtered, filters.conditions)
  filtered = applyPriceFilter(filtered, filters.minPrice, filters.maxPrice)
  filtered = applySellerRatingFilter(filtered, filters.sellerRating)
  filtered = applyFeaturesFilter(filtered, filters.features)
  filtered = applyBrandFilter(filtered, filters.brands)
  filtered = applyColorFilter(filtered, filters.colors)
  filtered = applySizeFilter(filtered, filters.sizes)
  filtered = applyMaterialFilter(filtered, filters.materials)

  return filtered
}

/**
 * Apply sorting to listings
 */
export function applySorting(
  listings: Listing[],
  sortConfig: SortConfig
): Listing[] {
  switch (sortConfig.option) {
    case 'newest':
      return sortByNewest(listings)

    case 'price_low':
      return sortByPrice(listings, 'asc')

    case 'price_high':
      return sortByPrice(listings, 'desc')

    case 'condition':
      return sortByCondition(listings)

    case 'seller_rating':
      return sortBySellerRating(listings)

    case 'features':
      return sortByFeatures(listings)

    default:
      return listings
  }
}

/**
 * Apply both filters and sorting (convenience function)
 */
export function applyFiltersAndSort(
  listings: Listing[],
  filters: FilterOptions,
  sortConfig: SortConfig
): Listing[] {
  const filtered = applyFilters(listings, filters)
  const sorted = applySorting(filtered, sortConfig)
  return sorted
}

// ============================================================================
// UTILITY FUNCTIONS FOR UI
// ============================================================================

/**
 * Get unique values from listings for filter options
 */
export function getUniqueFilterOptions(listings: Listing[]) {
  const brands = new Set<string>()
  const colors = new Set<string>()
  const sizes = new Set<string>()
  const materials = new Set<string>()
  const features = new Set<string>()

  listings.forEach(listing => {
    if (listing.brand) brands.add(listing.brand)
    if (listing.color) colors.add(listing.color)
    if (listing.size) sizes.add(listing.size)
    if (listing.material) materials.add(listing.material)
    if (listing.features) {
      listing.features.forEach(feature => features.add(feature))
    }
  })

  return {
    brands: Array.from(brands).sort(),
    colors: Array.from(colors).sort(),
    sizes: Array.from(sizes).sort(),
    materials: Array.from(materials).sort(),
    features: Array.from(features).sort()
  }
}

/**
 * Get active filter count (for UI badge)
 */
export function getActiveFilterCount(filters: FilterOptions): number {
  let count = 0

  if (filters.search) count++
  if (filters.category && filters.category !== 'All') count++
  if (filters.conditions && filters.conditions.length > 0) count += filters.conditions.length
  if (filters.minPrice !== undefined) count++
  if (filters.maxPrice !== undefined) count++
  if (filters.sellerRating) count++
  if (filters.features && filters.features.length > 0) count += filters.features.length
  if (filters.brands && filters.brands.length > 0) count += filters.brands.length
  if (filters.colors && filters.colors.length > 0) count += filters.colors.length
  if (filters.sizes && filters.sizes.length > 0) count += filters.sizes.length
  if (filters.materials && filters.materials.length > 0) count += filters.materials.length

  return count
}

/**
 * Clear all filters
 */
export function clearFilters(): FilterOptions {
  return {}
}
