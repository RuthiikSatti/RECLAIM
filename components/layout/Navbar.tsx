'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUnreadMessageCount } from '@/lib/chat/actions'
import type { Session } from '@supabase/supabase-js'

export default function Navbar() {
  const [supabase] = useState(() => createClient())
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      try {
        const { data } = await supabase.auth.getSession()
        if (mounted) {
          setSession(data.session ?? null)
          setLoading(false)

          // Load unread count if logged in
          if (data.session) {
            loadUnreadCount()
          }
        }
      } catch (error) {
        console.error('Error loading session:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    async function loadUnreadCount() {
      const { count } = await getUnreadMessageCount()
      if (mounted) {
        setUnreadCount(count)
      }
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (mounted) {
        setSession(session ?? null)
        setLoading(false)
        if (session) {
          loadUnreadCount()
        }
      }
    })

    // Subscribe to new messages
    const channel = supabase
      .channel('navbar-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          if (mounted && session) {
            loadUnreadCount()
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      // safe unsubscribe
      try {
        listener?.subscription?.unsubscribe?.()
        supabase.removeChannel(channel)
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
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex gap-8 items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">Reclaim</h1>
            </Link>

            <Link href="/marketplace" className="text-black hover:text-blue-600">
              Marketplace
            </Link>

            {!loading && session && (
              <>
                <Link href="/create" className="text-black hover:text-blue-600">
                  Sell Item
                </Link>
                <Link href="/messages" className="text-black hover:text-blue-600 relative">
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>

          <div className="flex gap-4 items-center">
            {!loading && session ? (
              <>
                <Link href={`/profile/${session.user.id}`} className="text-black hover:text-blue-600">
                  {displayName}
                </Link>
                <button onClick={handleSignOut} className="text-black hover:text-blue-600 px-3 py-2">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-black hover:text-blue-600 px-3 py-2">
                  Sign in
                </Link>
                <Link href="/signup" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg">
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
