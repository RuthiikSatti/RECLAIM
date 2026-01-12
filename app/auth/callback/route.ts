import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const code = requestUrl.searchParams.get('code')
  let next = requestUrl.searchParams.get('next') ?? '/reset-password'

  console.log('[Auth Callback] Parameters:', { token_hash: !!token_hash, type, code: !!code, next })

  // Validate next parameter to prevent open redirects - must start with / and not //
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/reset-password'
  }

  const supabase = await createClient()

  // Handle PKCE flow - Supabase sends token_hash with "pkce_" prefix for password recovery
  if (token_hash && type === 'recovery') {
    console.log('[Auth Callback] Processing password recovery with token_hash')

    // Check if this is a PKCE token (starts with "pkce_")
    if (token_hash.startsWith('pkce_')) {
      console.log('[Auth Callback] Detected PKCE token, using exchangeCodeForSession')
      const { error } = await supabase.auth.exchangeCodeForSession(token_hash)

      if (error) {
        console.error('[Auth Callback] PKCE token exchange error:', error)
      } else {
        console.log('[Auth Callback] PKCE token exchanged successfully, redirecting to:', next)
        return NextResponse.redirect(new URL(next, request.url))
      }
    } else {
      // Legacy OTP flow
      console.log('[Auth Callback] Using OTP verification for recovery')
      const { error } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash,
      })

      if (error) {
        console.error('[Auth Callback] OTP verification error:', error)
      } else {
        console.log('[Auth Callback] OTP verified successfully, redirecting to:', next)
        return NextResponse.redirect(new URL(next, request.url))
      }
    }
  }

  // Handle standard PKCE flow with code parameter
  if (code) {
    console.log('[Auth Callback] Exchanging code for session...')
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Code exchange error:', error)
    } else {
      console.log('[Auth Callback] Code exchanged successfully, redirecting to:', next)
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // If there's an error or no valid parameters, redirect to home
  console.log('[Auth Callback] No valid auth flow, redirecting to home')
  return NextResponse.redirect(new URL('/', request.url))
}
