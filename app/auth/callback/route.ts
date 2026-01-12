import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/reset-password'

  if (token_hash && type) {
    const supabase = await createClient()

    // For password recovery, verify the OTP token
    if (type === 'recovery') {
      const { error } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash,
      })

      if (!error) {
        return NextResponse.redirect(new URL(next, request.url))
      }
    }
  }

  // Handle PKCE flow with code parameter (newer Supabase flow)
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // If there's an error or no valid parameters, redirect to home
  return NextResponse.redirect(new URL('/', request.url))
}
