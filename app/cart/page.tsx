'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils/helpers'
import useCart from '@/hooks/useCart'
import type { Listing } from '@/types/database'

export default function CartPage() {
  const [supabase] = useState(() => createClient())
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const { cart, removeFromCart, loadingIds } = useCart()
  const router = useRouter()

  // Fetch listing details for items in cart
  useEffect(() => {
    async function fetchListings() {
      console.debug('Cart page: fetching listings for cart', cart)

      if (cart.length === 0) {
        setListings([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .in('id', cart)

        if (error) throw error
        console.debug('Cart page: fetched listings', data)
        setListings(data || [])
      } catch (err) {
        console.error('Failed to fetch cart listings:', err)
        setListings([])
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [cart, supabase])

  // Re-fetch when cart is updated from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      console.debug('Cart page: received cart update event')
      // The cart state will update via useCart hook, triggering the fetchListings effect
    }

    window.addEventListener('cart-updated', handleCartUpdate)
    return () => window.removeEventListener('cart-updated', handleCartUpdate)
  }, [])

  // Calculate total (no quantities, just sum all prices)
  const calculateTotal = () => {
    return listings.reduce((total, listing) => total + listing.price, 0)
  }

  // Checkout disabled for MVP
  const handleCheckout = () => {
    router.push('/payments-coming-soon')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-black mt-4">Loading cart...</p>
        </div>
      </div>
    )
  }

  // Empty cart state
  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="heading-primary text-black mb-8">SHOPPING CART</h1>

          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-24 h-24 mx-auto mb-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <h2 className="text-2xl font-bold text-black mb-4">Your cart is empty</h2>
            <p className="text-black mb-8">Start shopping to add items to your cart</p>
            <Link
              href="/marketplace"
              className="inline-block bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="heading-primary text-black mb-8">SHOPPING CART</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {listings.map((listing) => {
              const isRemoving = loadingIds[listing.id] === true

              return (
                <div key={listing.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link href={`/item/${listing.id}`} className="flex-shrink-0">
                      {listing.image_urls?.[0] ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
                          <Image
                            src={listing.image_urls[0]}
                            alt={listing.title}
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
                      <Link href={`/item/${listing.id}`}>
                        <h3 className="text-lg font-semibold text-black hover:underline truncate">
                          {listing.title}
                        </h3>
                      </Link>
                      <p className="text-lg font-bold text-black mt-1">
                        {formatPrice(listing.price)}
                      </p>

                      {/* Remove Button */}
                      <div className="mt-4">
                        <button
                          onClick={() => removeFromCart(listing.id)}
                          disabled={isRemoving}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            isRemoving
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-white border border-red-600 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {isRemoving ? 'Removing...' : 'Remove from cart'}
                        </button>
                      </div>
                    </div>

                    {/* Price (no subtotal since quantity is always 1) */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-black">
                        {formatPrice(listing.price)}
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
              <h2 className="text-xl font-bold text-black mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-black">Subtotal ({listings.length} {listings.length === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Shipping</span>
                  <span className="font-semibold">Calculated at checkout</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-black">Total</span>
                    <span className="text-lg font-bold text-black">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Disabled checkout for MVP */}
              <button
                onClick={handleCheckout}
                className="w-full bg-gray-300 text-black px-6 py-3 rounded-lg font-semibold mb-4 cursor-not-allowed"
                title="Payments are disabled in the MVP"
                disabled
              >
                Payments coming soon
              </button>

              <Link
                href="/marketplace"
                className="block text-center text-black hover:underline font-medium"
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
