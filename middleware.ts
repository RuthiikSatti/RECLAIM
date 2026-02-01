import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Public routes that don't need session updates or auth checks
  // Note: /reset-password needs session updates to verify the reset token
  const publicPaths = ['/forgot-password', '/login', '/signup']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Update session for all other routes (including /auth/callback and /reset-password)
  // This is where Supabase will handle PKCE code exchange and session creation
  const response = await updateSession(request)

  // Check authentication for protected routes
  const protectedPaths = ['/marketplace', '/create', '/profile', '/admin', '/messages', '/edit']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath) {
    // Create a new response to avoid mutating the request
    let supabaseResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Update user activity (fire and forget - don't block the request)
    // The database function has built-in debouncing (1 minute)
    void supabase.rpc('update_user_activity', { p_user_id: user.id })

    return supabaseResponse
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|sw\.js|manifest\.json|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
