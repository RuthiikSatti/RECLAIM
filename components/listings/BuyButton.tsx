'use client'

/**
 * BuyButton Component
 *
 * Provides "Add to Cart" and "Buy Now" buttons for listings.
 * Buy Now redirects to cart page for checkout.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { addToCart } from '@/lib/cart/actions'
import type { Listing } from '@/types/database'

interface BuyButtonProps {
  listing: Listing
  className?: string
}

export default function BuyButton({ listing, className = '' }: BuyButtonProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [buyLoading, setBuyLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddToCart = async () => {
    try {
      setCartLoading(true)
      setError(null)

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(`/item/${listing.id}`)}`
        return
      }

      // Prevent adding your own listing
      if (user.id === listing.user_id) {
        setError('You cannot add your own listing to cart')
        setCartLoading(false)
        return
      }

      const result = await addToCart(listing.id, 1)

      if (result.error) {
        setError(result.error)
      } else {
        setAdded(true)
        router.refresh()
        setTimeout(() => setAdded(false), 2000)
      }
    } catch (err: any) {
      console.error('Add to cart error:', err)
      setError(err.message || 'Failed to add to cart')
    } finally {
      setCartLoading(false)
    }
  }

  const handleBuyNow = async () => {
    try {
      setBuyLoading(true)
      setError(null)

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(`/item/${listing.id}`)}`
        return
      }

      // Prevent buying your own listing
      if (user.id === listing.user_id) {
        setError('You cannot purchase your own listing')
        setBuyLoading(false)
        return
      }

      // Add to cart and redirect to cart page
      const result = await addToCart(listing.id, 1)

      if (result.error) {
        setError(result.error)
        setBuyLoading(false)
        return
      }

      // Redirect to cart for checkout
      router.push('/cart')

    } catch (err: any) {
      console.error('Buy now error:', err)
      setError(err.message || 'Failed to proceed to checkout')
      setBuyLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Buy Now Button */}
      <button
        onClick={handleBuyNow}
        disabled={buyLoading || cartLoading}
        className={`w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {buyLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          `Buy Now - $${(listing.price / 100).toFixed(2)}`
        )}
      </button>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={buyLoading || cartLoading || added}
        className={`w-full border-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
          added
            ? 'border-green-600 text-green-600 bg-green-50'
            : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {cartLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding...
          </span>
        ) : added ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Added to Cart!
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Add to Cart
          </span>
        )}
      </button>

      {error && (
        <p className="text-red-600 text-sm text-center">{error}</p>
      )}
    </div>
  )
}
