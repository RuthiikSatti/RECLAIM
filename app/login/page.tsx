'use client'

import { signIn } from '@/lib/auth/actions'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setSuccessMessage('Your password has been reset successfully. You can now log in with your new password.')
    }
  }, [searchParams])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    const result = await signIn(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ume-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-ume-indigo">
            Log in to <span className="text-ume-indigo">U</span><span className="text-ume-pink">M</span><span className="text-ume-pink">E</span>
          </h2>
        </div>
        <form action={handleSubmit} className="mt-8 space-y-6">
          {successMessage && (
            <div className="rounded-md bg-white border-2 border-green-500 p-4">
              <p className="text-sm text-black">{successMessage}</p>
            </div>
          )}
          {error && (
            <div className="rounded-md bg-white border-2 border-black p-4">
              <p className="text-sm text-black">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Username or Email
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black focus:outline-none focus:ring-black focus:border-black"
                placeholder="Enter username or email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black focus:outline-none focus:ring-black focus:border-black"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-ume-pink hover:bg-pink-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ume-pink disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <p className="mt-6 text-center text-base text-black">
            Need an account?{' '}
            <Link href="/signup" className="font-semibold text-blue-600 hover:text-ume-pink transition-colors">
              SIGN UP
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ume-bg flex items-center justify-center">
        <div className="text-black">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
