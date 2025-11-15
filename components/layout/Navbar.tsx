'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useConversations } from '@/lib/hooks/useConversations'
import type { Session } from '@supabase/supabase-js'

export default function Navbar() {
  const [supabase] = useState(() => createClient())
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Use enhanced conversations hook for real-time unread count
  const { totalUnreadCount } = useConversations()

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      try {
        const { data } = await supabase.auth.getSession()
        if (mounted) {
          setSession(data.session ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading session:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (mounted) {
        setSession(session ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      // safe unsubscribe
      try {
        listener?.subscription?.unsubscribe?.()
      } catch (e) {
        // ignore
      }
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // redirect to login so protected pages and UI update immediately
    router.push('/login')
  }

  const displayName = session?.user?.user_metadata?.display_name ||
                       session?.user?.user_metadata?.full_name ||
                       session?.user?.user_metadata?.name ||
                       session?.user?.email?.split('@')[0] ||
                       'Profile'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left: Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-black tracking-tight">RECLAIM</h1>
          </Link>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 text-gray-700 placeholder-gray-400"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-6">
            {!loading && session ? (
              <>
                {/* Marketplace Link - Hidden on mobile */}
                <Link href="/marketplace" className="hidden lg:flex items-center text-gray-700 hover:text-black transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </Link>

                {/* Sell Item */}
                <Link href="/create" className="hidden lg:flex items-center text-gray-700 hover:text-black transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>

                {/* Messages with Red Dot */}
                <Link href="/messages" className="relative text-gray-700 hover:text-black transition-colors">
                  {/* Envelope Icon */}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {/* Red Dot (no number) */}
                  {totalUnreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                      aria-label="You have unread messages"
                    />
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div className="hidden lg:flex flex-col items-start">
                      <span className="text-xs text-gray-500">Hello</span>
                      <span className="text-sm font-medium leading-none">{displayName}</span>
                    </div>
                    <svg className="hidden lg:block w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link href={`/profile/${session.user.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      My Profile
                    </Link>
                    <Link href="/marketplace" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 lg:hidden">
                      Marketplace
                    </Link>
                    <Link href="/create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 lg:hidden">
                      Sell Item
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-black font-medium transition-colors">
                  Sign in
                </Link>
                <Link href="/signup" className="bg-black text-white hover:bg-gray-800 px-6 py-2.5 rounded-lg font-medium transition-colors">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
