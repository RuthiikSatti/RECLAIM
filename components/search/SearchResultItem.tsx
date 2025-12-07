'use client'

/**
 * SearchResultItem Component
 *
 * Renders a single search result with thumbnail, title, and price
 */

import Link from 'next/link'
import type { Listing } from '@/types/database'

interface SearchResultItemProps {
  listing: Listing
  onSelect?: () => void
}

export default function SearchResultItem({ listing, onSelect }: SearchResultItemProps) {
  const imageUrl = listing.image_urls?.[0] || '/placeholder.png'
  const priceFormatted = `$${(listing.price / 100).toFixed(2)}`

  return (
    <Link
      href={`/item/${listing.id}`}
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-md"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title and Price */}
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
    </Link>
  )
}
