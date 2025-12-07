'use client'

/**
 * Order Success Page
 *
 * Displayed after successful Stripe checkout.
 * Shows order confirmation and details.
 */

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types/database'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')

  const [supabase] = useState(() => createClient())
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let pollAttempts = 0
    const maxPollAttempts = 10 // Poll for max 30 seconds (10 attempts × 3 seconds)

    async function fetchOrder() {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*, buyer:users!buyer_id(*), seller:users!seller_id(*), listing:listings(*)')
          .eq('stripe_checkout_session_id', sessionId)
          .maybeSingle() // Use maybeSingle instead of single to handle no results gracefully

        if (!mounted) return

        if (fetchError) {
          console.error('Error fetching order:', fetchError)
          // Don't set error immediately, might just be webhook delay
          if (pollAttempts >= maxPollAttempts) {
            setError('Order not found. Please check your email for confirmation or contact support.')
            setLoading(false)
          }
        } else if (data) {
          setOrder(data as Order)
          setLoading(false)
        } else {
          // No data found yet
          console.log('Order not found yet, attempt:', pollAttempts)
          if (pollAttempts >= maxPollAttempts) {
            setError('Order is processing. Check your email for confirmation.')
            setLoading(false)
          }
        }
      } catch (err: any) {
        if (!mounted) return
        console.error('Error:', err)
        if (pollAttempts >= maxPollAttempts) {
          setError('Failed to load order details. Please check your email.')
          setLoading(false)
        }
      }
    }

    fetchOrder()

    // Poll for order if not found immediately (webhook might be delayed)
    const pollInterval = setInterval(() => {
      pollAttempts++
      if (!order && !error && pollAttempts < maxPollAttempts) {
        fetchOrder()
      } else if (pollAttempts >= maxPollAttempts) {
        clearInterval(pollInterval)
        if (!order && !error) {
          setError('Order is still processing. Check your email for confirmation.')
          setLoading(false)
        }
      }
    }, 3000)

    return () => {
      mounted = false
      clearInterval(pollInterval)
    }
  }, [sessionId, supabase])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading order details...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Processing Order</h1>
            <p className="text-gray-600 mt-2">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              Your payment was successful. Order details may take a few moments to appear.
            </p>
            <div className="mt-8 flex gap-4 justify-center">
              <Link
                href="/marketplace"
                className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>
        ) : order ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Success Header */}
            <div className="bg-green-50 border-b border-green-200 p-8 text-center">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-3xl font-bold text-gray-900 mt-4">Payment Successful!</h1>
              <p className="text-gray-600 mt-2">Thank you for your purchase</p>
            </div>

            {/* Order Details */}
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{order.id.slice(0, 8)}...</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {order.status.toUpperCase()}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">
                      ${(order.amount_cents / 100).toFixed(2)} USD
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Item Details */}
              {order.listing && (
                <div className="mt-6 border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Item Purchased</h2>
                  <div className="flex gap-4">
                    {order.listing.image_urls?.[0] && (
                      <img
                        src={order.listing.image_urls[0]}
                        alt={order.listing.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{order.listing.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {order.listing.description}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Category: {order.listing.category}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Seller Details */}
              {order.seller && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Seller Information</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-700">
                        {order.seller.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.seller.display_name}</p>
                      <p className="text-sm text-gray-500">{order.seller.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>The seller has been notified of your purchase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Contact the seller via messages to arrange pickup/delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>A confirmation email has been sent to {order.buyer_email}</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/messages?listing=${order.listing_id}`}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-center hover:bg-blue-700 transition-colors"
                >
                  Message Seller
                </Link>
                <Link
                  href="/marketplace"
                  className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium text-center hover:bg-gray-300 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
