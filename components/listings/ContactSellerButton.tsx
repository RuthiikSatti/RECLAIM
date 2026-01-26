'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateConversation } from '@/lib/chat/conversations'
import type { Listing } from '@/types/database'

interface ContactSellerButtonProps {
  listing: Listing
  className?: string
}

export default function ContactSellerButton({ listing, className = '' }: ContactSellerButtonProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' } | null>(null)

  // Generate default prefill message
  const generatePrefillMessage = (): string => {
    return `Hi — I'm interested in "${listing.title}". Are you available to meet on campus for pickup?`
  }

  // Handle Contact Seller - Opens direct conversation thread
  const handleContactSeller = async () => {
    try {
      setLoading(true)
      setMessage(null)

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(`/item/${listing.id}`)}`
        return
      }

      // Prevent contacting yourself
      if (user.id === listing.user_id) {
        setMessage({ text: 'This is your own listing', type: 'error' })
        setLoading(false)
        return
      }

      // Get or create conversation
      const result = await getOrCreateConversation(
        user.id,
        listing.user_id,
        listing.id
      )

      if (result.error || !result.conversationId) {
        setMessage({ text: result.error || 'Failed to open chat', type: 'error' })
        setLoading(false)
        return
      }

      // Navigate directly to conversation with optional prefill
      const prefillMessage = generatePrefillMessage()
      const encodedPrefill = encodeURIComponent(prefillMessage)
      router.push(`/messages?conversationId=${result.conversationId}&prefill=${encodedPrefill}`)

    } catch (err: any) {
      console.error('Contact seller error:', err)
      setMessage({ text: 'Failed to open chat', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* Contact Seller Button */}
      <button
        onClick={handleContactSeller}
        disabled={loading}
        className={`w-full bg-white text-ume-pink border-2 border-ume-pink px-6 py-3 rounded-full font-semibold hover:bg-pink-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-label={`Contact seller about ${listing.title}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Opening chat...
          </span>
        ) : (
          'Contact Seller'
        )}
      </button>

      {/* Error Messages */}
      {message && (
        <p className="text-sm text-center font-medium text-red-600" role="alert">
          {message.text}
        </p>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center">
        Contact seller to arrange payment via PayPal, Venmo, or cash
      </p>
    </div>
  )
}
