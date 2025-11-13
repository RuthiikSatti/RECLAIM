'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

export default function Navbar() {
  const [supabase] = useState(() => createClient())
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
              <Link href="/create" className="text-black hover:text-blue-600">
                Sell Item
              </Link>
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
