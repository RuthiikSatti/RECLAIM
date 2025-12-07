'use client'

/**
 * NewsletterSignup Component
 *
 * Newsletter signup section matching screenshot 3.
 * Features:
 * - Email input with submit button
 * - Form validation
 * - Accessible form controls
 */

import { useState } from 'react'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')

    // TODO: Replace with actual newsletter signup API call
    // For now, just simulate success
    setTimeout(() => {
      setStatus('success')
      setMessage('Thanks for signing up!')
      setEmail('')
    }, 1000)
  }

  return (
    <section className="w-full py-16 sm:py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-black tracking-[0.15em] text-center text-gray-900 mb-8 sm:mb-10" style={{ fontFamily: '"Marianina FY", system-ui, -apple-system, sans-serif' }}>
          SIGN UP TO RECLAIM MAIL
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === 'loading'}
              className="flex-1 px-6 py-4 border-2 border-gray-900 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-gray-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-4 bg-gray-900 text-white font-medium text-sm rounded-full hover:bg-gray-800 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-900/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {status === 'loading' ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>

          {/* Status Message */}
          {message && (
            <p
              className={`mt-4 text-center text-sm ${
                status === 'error' ? 'text-red-600' : 'text-green-600'
              }`}
              role="alert"
            >
              {message}
            </p>
          )}
        </form>

        {/* Privacy Note */}
        <p className="mt-6 text-xs text-center text-gray-500">
          We'll send you updates about new features and campus marketplace tips. Unsubscribe anytime.
        </p>
      </div>
    </section>
  )
}
