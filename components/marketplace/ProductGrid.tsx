'use client'

import Link from 'next/link'
import type { Listing } from '@/types/database'

/**
 * ProductGrid Component
 *
 * Displays listings in a responsive grid with square product cards.
 * Features:
 * - Square images (1:1 aspect ratio) with object-fit: cover
 * - Responsive: 4 cols desktop, 3 cols tablet, 2 cols mobile
 * - Shows: image, title, price, short description
 * - Optional distance display for radius-filtered listings
 */

interface ProductGridProps {
  listings: Listing[]
}

export default function ProductGrid({ listings }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ProductCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}

function ProductCard({ listing }: { listing: Listing }) {
  // Use first image or placeholder
  const imageUrl = listing.image_urls?.[0] || '/placeholder-image.jpg'

  // Truncate description to ~100 chars
  const shortDescription = listing.description
    ? listing.description.length > 100
      ? listing.description.substring(0, 100) + '...'
      : listing.description
    : ''

  return (
    <Link href={`/item/${listing.id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Square Image Container */}
        <div className="relative w-full pb-[100%] bg-gray-200 overflow-hidden">
          {/* Using padding-top: 100% technique to maintain square aspect ratio */}
          <img
            src={imageUrl}
            alt={listing.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />

          {/* Condition Badge (if available) */}
          {listing.condition && (
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
              {listing.condition}
            </div>
          )}

          {/* Distance Badge (if available from radius filter) */}
          {listing.distance_miles !== undefined && (
            <div className="absolute top-2 right-2 bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-white">
              {listing.distance_miles < 1
                ? '< 1 mi'
                : `${listing.distance_miles.toFixed(1)} mi`
              }
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-2">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>

          {/* Price */}
          <p className="text-xl font-bold text-blue-600">
            ${listing.price.toFixed(2)}
          </p>

          {/* Description */}
          {shortDescription && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {shortDescription}
            </p>
          )}

          {/* Seller Info (if available) */}
          {listing.user && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                  {listing.user.display_name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-gray-600 truncate">
                  @{listing.user.username || listing.user.display_name}
                </span>
              </div>
              {listing.user.college_name && (
                <p className="text-xs text-gray-500 mt-1 ml-8 truncate">
                  {listing.user.college_name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

/**
 * Alternative: Using aspect-ratio utility (if Tailwind v3.0+ with aspect-ratio plugin)
 *
 * If you prefer Tailwind's aspect-ratio utilities, replace the image container with:
 *
 * <div className="relative aspect-square bg-gray-200 overflow-hidden">
 *   <img
 *     src={imageUrl}
 *     alt={listing.title}
 *     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
 *     loading="lazy"
 *   />
 * </div>
 *
 * Note: aspect-square requires @tailwindcss/aspect-ratio plugin or Tailwind 3.0+
 */
