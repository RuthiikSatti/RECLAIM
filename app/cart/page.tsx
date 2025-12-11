'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getCartItems, removeFromCart, updateCartItemQuantity, type CartItem } from '@/lib/cart/actions'
import { formatPrice } from '@/lib/utils/helpers'

// Helper to normalize cart items from different data shapes
function normalizeCartItem(raw: any): any {
  // If it already has the canonical structure (listing object exists)
  if (raw.listing) {
    return {
      ...raw,
      quantity: raw.quantity ?? raw.qty ?? 1
    }
  }

  // Otherwise, convert from old flat structure
  return {
    id: raw.id,
    listing_id: raw.listing_id,
    quantity: raw.quantity ?? raw.qty ?? 1,
    listing: {
      id: raw.listing_id,
      title: raw.title ?? 'Untitled',
      price: Number(raw.price || 0),
      image_urls: raw.image_urls ?? (raw.image_url ? [raw.image_url] : []),
      user_id: raw.user_id || '' // fallback for localStorage items
    },
    seller_name: raw.seller_name ?? null,
    seller_campus: raw.seller_campus ?? null
  }
}

export default function CartPage() {
  const [supabase] = useState(() => createClient())
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()

  // Unified loader: attempt server (if logged in) then always fallback to localStorage
  const loadCart = useCallback(async (opts: { forceServer?: boolean } = {}) => {
    setLoading(true)
    setError(null)

    try {
      // try to get current user from supabase; do not redirect if no user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        // If we have a user, try server cart first (unless explicitly skipped)
        if (!opts.forceServer) {
          const result = await getCartItems()
          if (!result.error && Array.isArray(result.items)) {
            setCartItems(result.items.map(normalizeCartItem))
            setLoading(false)
            return
          }
          // if server returned error, we'll fall back to localStorage below
          if (result.error) {
            console.warn('Server cart error:', result.error)
          }
        }
      } else {
        // No user — we will not redirect. Guests use localStorage fallback.
        setCurrentUserId(null)
      }
    } catch (err) {
      console.warn('Error checking user or server cart:', err)
      // continue to fallback to localStorage
    }

    // LocalStorage fallback (works for guests and as resilient fallback)
    try {
      const raw = localStorage.getItem('reclaim_cart')
      const parsed = raw ? JSON.parse(raw) : []
      // normalize to array and normalize each item
      if (Array.isArray(parsed)) {
        setCartItems(parsed.map(normalizeCartItem))
      } else {
        setCartItems([])
      }
    } catch (err) {
      console.error('Failed to read reclaim_cart from localStorage', err)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // initial load
  useEffect(() => {
    loadCart()
  }, [loadCart])

  // Listen for cross-tab storage updates so cart refreshes when AddToCart writes
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'reclaim_cart') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : []
          setCartItems(Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [])
        } catch (err) {
          console.error('Failed to parse reclaim_cart from storage event', err)
          setCartItems([])
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Also listen for focus so when user returns to tab we reload cart (helps single-tab flow)
  useEffect(() => {
    function onFocus() {
      loadCart()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadCart])

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      if (item.listing) {
        return total + (item.listing.price * item.quantity)
      }
      return total
    }, 0)
  }

  // Handle remove
  const handleRemove = async (cartItemId: string) => {
    // Try server remove (if logged in) but always update UI + localStorage for resilience
    try {
      const result = await removeFromCart(cartItemId)
      if (result?.error) {
        console.warn('Server remove error:', result.error)
      }
    } catch (err) {
      console.warn('removeFromCart network error', err)
    }

    const newItems = cartItems.filter(item => item.id !== cartItemId)
    setCartItems(newItems)
    try {
      localStorage.setItem('reclaim_cart', JSON.stringify(newItems))
    } catch (err) {
      console.error('Failed to persist reclaim_cart after remove', err)
    }
  }

  // Handle quantity update
  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      const result = await updateCartItemQuantity(cartItemId, newQuantity)
      if (result?.error) {
        console.warn('Server update quantity error:', result.error)
      }
    } catch (err) {
      console.warn('updateCartItemQuantity network error', err)
    }

    const updated = cartItems.map(item =>
      item.id === cartItemId ? { ...item, quantity: newQuantity } : item
    )
    setCartItems(updated)
    try {
      localStorage.setItem('reclaim_cart', JSON.stringify(updated))
    } catch (err) {
      console.error('Failed to persist reclaim_cart after quantity change', err)
    }
  }

  // Checkout disabled for MVP
  const handleCheckout = () => {
    // For now keep them on the "payments coming soon" flow; do not attempt a real checkout.
    router.push('/payments-coming-soon')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading cart...</p>
        </div>
      </div>
    )
  }

  // show empty state (empty array or no listings)
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-24 h-24 mx-auto mb-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
            <Link
              href="/marketplace"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              if (!item.listing) return null

              return (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link href={`/item/${item.listing.id}`} className="flex-shrink-0">
                      {item.listing.image_urls?.[0] ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
                          <Image
                            src={item.listing.image_urls[0]}
                            alt={item.listing.title}
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
                      <Link href={`/item/${item.listing.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate">
                          {item.listing.title}
                        </h3>
                      </Link>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        {formatPrice(item.listing.price)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 border-x border-gray-300 font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="px-3 py-1 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(item.listing.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">Calculated at checkout</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Disabled checkout for MVP */}
              <button
                onClick={handleCheckout}
                className="w-full bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold mb-4 cursor-not-allowed"
                title="Payments are disabled in the MVP"
                disabled
              >
                Payments coming soon
              </button>

              <Link
                href="/marketplace"
                className="block text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Continue Shopping
              </Link>

              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-gray-500 text-center">
                  Payments are disabled for the MVP. Contact sellers via messages to arrange payment and pickup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
