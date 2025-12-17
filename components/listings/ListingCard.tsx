import Link from 'next/link'
import Image from 'next/image'
import type { Listing } from '@/types/database'
import { formatPrice, getTimeAgo } from '@/lib/utils/helpers'

export default function ListingCard({ listing }: { listing: Listing }) {
  const imageUrl = listing.image_urls?.[0] || '/placeholder-image.png'

  return (
    <Link href={`/item/${listing.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-48 bg-gray-200">
          {listing.image_urls && listing.image_urls.length > 0 ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
            {listing.title}
          </h3>
          <p className="text-black font-bold text-xl mb-2">
            {formatPrice(listing.price)}
          </p>
          <p className="text-black text-sm line-clamp-2 mb-2">
            {listing.description}
          </p>
          <div className="flex justify-between items-center text-sm text-black">
            <span className="bg-gray-100 px-2 py-1 rounded">
              {listing.category}
            </span>
            <span>{getTimeAgo(listing.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
