'use client'

/**
 * CartItem Component
 *
 * Displays a single cart item with:
 * - Item image, title, seller info, price, quantity
 * - Contact Seller (Pickup) button
 * - Ask About Shipping button
 * - Remove button
 *
 * No Buy/Checkout buttons - seller contact only
 */

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils/helpers'

export interface CartItemData {
  id: string
  listing_id: string
  title: string
  price: number
  qty: number
  seller_id: string
  seller_name: string
  seller_campus: string
  image_url: string | null
}

interface CartItemProps {
  item: CartItemData
  onRemove: (id: string) => void
  currentUserCampus?: string
}

export default function CartItem({ item, onRemove, currentUserCampus }: CartItemProps) {
  const router = useRouter()

  // Determine if seller is on same campus (for pickup suggestion)
  const isSameCampus = currentUserCampus && currentUserCampus === item.seller_campus

  // Generate prefilled messages
  const pickupMessage = encodeURIComponent(
    `Hi — I'm interested in "${item.title}". I'm on campus and would like to pick up. Are you available? Suggested meetup: campus post office.`
  )

  const shippingMessage = encodeURIComponent(
    `Hi — I'm interested in "${item.title}". Would you be able to ship to my campus post office? I will cover shipping via PayPal/Venmo.`
  )

  const handleContactSeller = (prefillMessage: string) => {
    router.push(`/messages?listing=${item.listing_id}&seller=${item.seller_id}&prefill=${prefillMessage}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex gap-4">
        {/* Image */}
        <Link href={`/item/${item.listing_id}`} className="flex-shrink-0">
          {item.image_url ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
            </div>
          )}
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <Link href={`/item/${item.listing_id}`}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate mb-1">
              {item.title}
            </h3>
          </Link>

          <div className="text-sm text-gray-600 mb-2">
            <p className="mb-1">
              Seller: <Link href={`/profile/${item.seller_id}`} className="text-blue-600 hover:underline font-medium">{item.seller_name}</Link>
            </p>
            <p>Campus: {item.seller_campus}</p>
          </div>

          <p className="text-lg font-bold text-blue-600 mb-3">
            {formatPrice(item.price)}
          </p>

          <div className="text-sm text-gray-600 mb-3">
            Quantity: {item.qty}
          </div>

          {/* Contact Seller Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleContactSeller(pickupMessage)}
              className="flex-1 min-w-[160px] bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm"
              aria-label={`Contact ${item.seller_name} about pickup for ${item.title}`}
            >
              {isSameCampus ? '📍 Contact for Pickup' : '💬 Contact Seller'}
            </button>

            <button
              onClick={() => handleContactSeller(shippingMessage)}
              className="flex-1 min-w-[160px] border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm"
              aria-label={`Ask ${item.seller_name} about shipping for ${item.title}`}
            >
              📦 Ask About Shipping
            </button>

            <button
              onClick={() => onRemove(item.id)}
              className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2"
              aria-label={`Remove ${item.title} from cart`}
            >
              Remove
            </button>
          </div>
        </div>

        {/* Subtotal */}
        <div className="text-right hidden sm:block">
          <p className="text-sm text-gray-600 mb-1">Subtotal</p>
          <p className="text-lg font-bold text-gray-900">
            {formatPrice(item.price * item.qty)}
          </p>
        </div>
      </div>
    </div>
  )
}
