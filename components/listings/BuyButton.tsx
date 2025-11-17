'use client'

/**
 * BuyButton Component
 *
 * Redirects users to the "Payments Coming Soon" page.
 * Stripe integration temporarily disabled until business registration is complete.
 *
 * TODO: Enable Stripe checkout after LLC setup and Stripe account activation
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/types/database'

interface BuyButtonProps {
  listing: Listing
  className?: string
}

export default function BuyButton({ listing, className = '' }: BuyButtonProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to login with return URL
        window.location.href = `/login?returnUrl=${encodeURIComponent(`/item/${listing.id}`)}`
        return
      }

      // Prevent buying your own listing
      if (user.id === listing.user_id) {
        setError('You cannot purchase your own listing')
        setLoading(false)
        return
      }

      // TODO: Enable Stripe checkout after LLC setup
      // Redirect to payments coming soon page
      router.push('/payments-coming-soon')

      /* DISABLED - Stripe checkout integration
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error(data.message || 'Payments are currently unavailable')
        }
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
      */

    } catch (err: any) {
      console.error('Purchase error:', err)
      setError(err.message || 'Failed to initiate purchase')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePurchase}
        disabled={loading}
        className={`w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {loading ? (
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

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-2 text-center">
        Secure payments coming soon
      </p>
    </div>
  )
}
