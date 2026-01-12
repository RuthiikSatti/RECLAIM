'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const next = searchParams.get('next') || '/reset-password'
        const fullUrl = window.location.href

        console.log('[Auth Callback] Processing callback:', {
          fullUrl,
          hasCode: !!code,
          next,
          allParams: Object.fromEntries(searchParams.entries())
        })

        // Validate next parameter to prevent open redirects
        if (!next.startsWith('/') || next.startsWith('//')) {
          console.error('[Auth Callback] Invalid next parameter:', next)
          setError('Invalid redirect parameter')
          setDebugInfo({ error: 'Invalid next parameter', next })
          return
        }

        if (!code) {
          console.error('[Auth Callback] No code parameter found')
          setError('No authentication code found')
          setDebugInfo({ error: 'No code parameter', searchParams: Object.fromEntries(searchParams.entries()) })
          return
        }

        const supabase = createClient()

        console.log('[Auth Callback] Attempting to exchange code for session...')

        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        console.log('[Auth Callback] Exchange result:', {
          hasSession: !!data.session,
          hasUser: !!data.user,
          userId: data.user?.id,
          error: exchangeError?.message
        })

        if (exchangeError) {
          console.error('[Auth Callback] Exchange error:', exchangeError)
          setError(exchangeError.message)
          setDebugInfo({
            error: exchangeError,
            code: code.substring(0, 20) + '...'
          })

          // Redirect to forgot-password with error after 3 seconds
          setTimeout(() => {
            const errorUrl = `/forgot-password?error=${encodeURIComponent(exchangeError.message)}`
            router.push(errorUrl)
          }, 3000)
          return
        }

        if (!data.session || !data.user) {
          console.error('[Auth Callback] No session after exchange')
          setError('Failed to create session')
          setDebugInfo({
            error: 'No session created',
            hasSession: !!data.session,
            hasUser: !!data.user
          })

          // Redirect to forgot-password with error after 3 seconds
          setTimeout(() => {
            router.push('/forgot-password?error=Failed+to+create+session')
          }, 3000)
          return
        }

        // Check if session was stored in localStorage/cookies
        const { data: { session: storedSession } } = await supabase.auth.getSession()
        console.log('[Auth Callback] Stored session check:', {
          hasStoredSession: !!storedSession,
          sessionId: storedSession?.access_token?.substring(0, 20) + '...'
        })

        console.log('[Auth Callback] Success! Redirecting to:', next)

        // Redirect to the next page
        router.push(next)
      } catch (err) {
        console.error('[Auth Callback] Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        setDebugInfo({ error: err })

        // Redirect to forgot-password with error after 3 seconds
        setTimeout(() => {
          router.push('/forgot-password?error=An+unexpected+error+occurred')
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  // Show loading state or error
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {error ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">
                Authentication Error
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {error}
              </p>
              {debugInfo && (
                <pre className="text-xs text-left bg-gray-100 p-4 rounded overflow-auto max-h-64">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              )}
              <p className="text-xs text-gray-500 mt-4">
                Redirecting to forgot password page...
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">
                Verifying...
              </h2>
              <p className="text-sm text-gray-600">
                Please wait while we verify your authentication.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
