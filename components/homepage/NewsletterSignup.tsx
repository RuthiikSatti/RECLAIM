'use client'

/**
 * NewsletterSignup Component
 *
 * Newsletter signup section matching the UME design:
 * - Cream/beige background
 * - "SIGN UP TO UME MAIL" heading in dark indigo
 * - Email input with rounded borders
 * - Dark/black signup button
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
    <section className="w-full py-8 sm:py-12 bg-ume-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading - Dark Indigo */}
        <h2 className="font-black text-2xl sm:text-3xl md:text-4xl uppercase text-center tracking-tight text-ume-indigo mb-4 sm:mb-6">
          SIGN UP TO UME MAIL
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === 'loading'}
              className="flex-1 px-6 py-4 border-2 border-gray-800 rounded-full text-sm bg-white focus:outline-none focus:ring-4 focus:ring-ume-indigo/30 focus:border-ume-indigo disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-4 bg-ume-pink text-white font-semibold text-sm rounded-full hover:bg-pink-400 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-ume-pink/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
        <p className="mt-4 text-sm text-center text-gray-600">
          We'll send you updates about new features and campus marketplace tips. Unsubscribe anytime.
        </p>
      </div>
    </section>
  )
}
