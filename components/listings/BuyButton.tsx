'use client'

/**
 * BuyButton Component - MVP with Contact Seller + Robust Add to Cart
 *
 * Features:
 * - Contact Seller: Opens messages with context-aware prefilled message
 * - Ask About Shipping: Opens messages with shipping inquiry
 * - Add to Cart: Tries server POST, falls back to localStorage on any error
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/types/database'

interface BuyButtonProps {
  listing: Listing
  className?: string
}

const LOCALSTORAGE_CART_KEY = 'reclaim_cart'

export default function BuyButton({ listing, className = '' }: BuyButtonProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [cartLoading, setCartLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const [cartMessage, setCartMessage] = useState<{ text: string; type: 'success' | 'error' | 'local' } | null>(null)

  // Generate context-aware prefill message
  const generatePrefillMessage = (isShipping: boolean): string => {
    if (isShipping) {
      return `Hi — I'm interested in "${listing.title}". Would you be able to ship to my campus post office? I will cover shipping via PayPal/Venmo.`
    } else {
      return `Hi — I'm interested in "${listing.title}". I'm on campus and would like to pick up. Are you available? Suggested meetup: campus post office.`
    }
  }

  // Handle Contact Seller (Pickup)
  const handleContactSeller = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(`/item/${listing.id}`)}`
        return
      }

      // Prevent contacting yourself
      if (user.id === listing.user_id) {
        setCartMessage({ text: 'This is your own listing', type: 'error' })
        return
      }

      // Generate prefill and navigate
      const prefillMessage = generatePrefillMessage(false) // pickup
      const encodedPrefill = encodeURIComponent(prefillMessage)
      router.push(`/messages?listing=${listing.id}&prefill=${encodedPrefill}`)

    } catch (err: any) {
      console.error('Contact seller error:', err)
      setCartMessage({ text: 'Failed to open chat', type: 'error' })
    }
  }

  // Handle Ask About Shipping
  const handleAskShipping = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(`/item/${listing.id}`)}`
        return
      }

      // Prevent contacting yourself
      if (user.id === listing.user_id) {
        setCartMessage({ text: 'This is your own listing', type: 'error' })
        return
      }

      // Generate prefill and navigate
      const prefillMessage = generatePrefillMessage(true) // shipping
      const encodedPrefill = encodeURIComponent(prefillMessage)
      router.push(`/messages?listing=${listing.id}&prefill=${encodedPrefill}`)

    } catch (err: any) {
      console.error('Ask shipping error:', err)
      setCartMessage({ text: 'Failed to open chat', type: 'error' })
    }
  }

  // Handle Add to Cart with robust fallback
  const handleAddToCart = async () => {
    try {
      setCartLoading(true)
      setCartMessage(null)

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      // Build item object
      const item = {
        id: `cart-${listing.id}-${Date.now()}`,
        listing_id: listing.id,
        title: listing.title,
        price: listing.price,
        seller_name: listing.user?.display_name || 'Unknown',
        seller_campus: listing.user?.university_domain || 'Unknown',
        qty: 1,
        image_url: listing.image_urls?.[0] || null
      }

      // Prevent adding your own listing
      if (user && user.id === listing.user_id) {
        setCartMessage({ text: 'You cannot add your own listing to cart', type: 'error' })
        setCartLoading(false)
        return
      }

      // Try server POST first (only if user is logged in)
      if (user) {
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item })
          })

          if (response.ok) {
            // Success - server saved the item
            setAdded(true)
            setCartMessage({ text: 'Added to cart', type: 'success' })
            router.refresh()
            setTimeout(() => {
              setAdded(false)
              setCartMessage(null)
            }, 3000)
            setCartLoading(false)
            return
          }

          // Server returned error - fall through to localStorage
          console.warn('Server cart failed, using localStorage fallback')
        } catch (fetchError) {
          // Network error or fetch failed - fall through to localStorage
          console.warn('Cart API fetch failed, using localStorage fallback:', fetchError)
        }
      }

      // Fallback to localStorage
      try {
        const existingCart = localStorage.getItem(LOCALSTORAGE_CART_KEY)
        const cartItems = existingCart ? JSON.parse(existingCart) : []

        // Check if item already exists
        const existingIndex = cartItems.findIndex((i: any) => i.listing_id === listing.id)

        if (existingIndex >= 0) {
          // Update quantity
          cartItems[existingIndex].qty += 1
        } else {
          // Add new item
          cartItems.push(item)
        }

        localStorage.setItem(LOCALSTORAGE_CART_KEY, JSON.stringify(cartItems))

        setAdded(true)
        setCartMessage({ text: 'Added to cart (saved locally)', type: 'local' })
        setTimeout(() => {
          setAdded(false)
          setCartMessage(null)
        }, 3000)
      } catch (localStorageError) {
        // localStorage failed
        console.error('localStorage failed:', localStorageError)
        setCartMessage({ text: 'Failed to add to cart', type: 'error' })
      }

    } catch (err: any) {
      console.error('Add to cart error:', err)
      setCartMessage({ text: 'Failed to add to cart', type: 'error' })
    } finally {
      setCartLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Contact Seller Button (Pickup) */}
      <button
        onClick={handleContactSeller}
        className={`w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors ${className}`}
        aria-label={`Contact seller about ${listing.title}`}
      >
        💬 Contact Seller
      </button>

      {/* Ask About Shipping Button */}
      <button
        onClick={handleAskShipping}
        className="w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
        aria-label={`Ask about shipping for ${listing.title}`}
      >
        📦 Ask About Shipping
      </button>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={cartLoading || added}
        className={`w-full border-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
          added
            ? 'border-green-600 text-green-600 bg-green-50'
            : 'border-blue-600 text-blue-600 hover:bg-blue-50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={`Add ${listing.title} to cart`}
      >
        {cartLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding...
          </span>
        ) : added ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            {cartMessage?.type === 'local' ? 'Added (Saved Locally)' : 'Added to Cart!'}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Add to Cart
          </span>
        )}
      </button>

      {/* Status Messages */}
      {cartMessage && (
        <p
          className={`text-sm text-center font-medium ${
            cartMessage.type === 'error'
              ? 'text-red-600'
              : cartMessage.type === 'local'
              ? 'text-orange-600'
              : 'text-green-600'
          }`}
          role="alert"
        >
          {cartMessage.text}
        </p>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center">
        Contact seller to arrange payment via PayPal, Venmo, or cash
      </p>
    </div>
  )
}
