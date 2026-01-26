'use client'

/**
 * Contact Us Page
 *
 * Contact form matching the reference design with:
 * - Two-column name fields
 * - Email with newsletter checkbox
 * - Phone field
 * - Dropdown for referral source
 * - Message textarea
 * - Submit button
 */

import { useState, FormEvent } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    signUpNewsletter: false,
    phone: '',
    referralSource: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      setStatus('error')
      setErrorMessage('Please fill in all required fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address')
      return
    }

    try {
      // Send to API route
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      setStatus('success')
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        signUpNewsletter: false,
        phone: '',
        referralSource: '',
        message: ''
      })

      // Clear success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000)
    } catch (error) {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
      console.error('Contact form error:', error)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  return (
    <div className="min-h-screen bg-ume-bg py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <h1 className="heading-primary text-black mb-12">
          CONTACT US
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields (Two Columns) */}
          <div>
            <label className="block text-sm font-normal text-black mb-2">
              Name <span className="text-black">(required)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm text-black mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-900/20 text-black"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm text-black mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-900/20 text-black"
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-normal text-black mb-2">
              Email <span className="text-black">(required)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-900/20 text-black"
            />
            <div className="mt-3 flex items-center">
              <input
                type="checkbox"
                id="signUpNewsletter"
                name="signUpNewsletter"
                checked={formData.signUpNewsletter}
                onChange={handleChange}
                className="w-4 h-4 border-2 border-gray-900 rounded focus:ring-4 focus:ring-gray-900/20"
              />
              <label htmlFor="signUpNewsletter" className="ml-2 text-sm text-black">
                Sign up for news and updates
              </label>
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-normal text-black mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-900/20 text-black"
            />
          </div>

          {/* Dropdown Field */}
          <div>
            <label htmlFor="referralSource" className="block text-sm font-normal text-black mb-2">
              How did you hear about us?
            </label>
            <select
              id="referralSource"
              name="referralSource"
              value={formData.referralSource}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-900/20 text-black bg-white appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23000'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.5rem'
              }}
            >
              <option value="">Select an option</option>
              <option value="search">Search Engine</option>
              <option value="social">Social Media</option>
              <option value="friend">Friend or Colleague</option>
              <option value="advertisement">Advertisement</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Message Textarea */}
          <div>
            <label htmlFor="message" className="block text-sm font-normal text-black mb-2">
              Message <span className="text-black">(required)</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-3xl focus:outline-none focus:ring-4 focus:ring-gray-900/20 text-black resize-none"
            />
          </div>

          {/* Success/Error Messages */}
          {status === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              ✓ Thank you! Your message has been sent successfully.
            </div>
          )}

          {status === 'error' && errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="px-12 py-4 bg-ume-pink text-white font-medium text-base rounded-full hover:bg-pink-400 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-ume-pink/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
