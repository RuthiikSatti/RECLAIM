import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const next = requestUrl.searchParams.get('next') ?? '/'

  console.log('[Auth Callback] Redirect params:', { next })

  // Validate next parameter to prevent open redirects - must start with / and not //
  if (!next.startsWith('/') || next.startsWith('//')) {
    console.log('[Auth Callback] Invalid next param, using default')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // The middleware will have already handled the session refresh/token exchange
  // via the Supabase SSR library, so we just redirect to the intended destination
  console.log('[Auth Callback] Redirecting to:', next)
  return NextResponse.redirect(new URL(next, request.url))
}
