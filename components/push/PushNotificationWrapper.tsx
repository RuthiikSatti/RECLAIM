'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PushNotificationPrompt from './PushNotificationPrompt'

/**
 * Wrapper component that only shows PushNotificationPrompt to authenticated users
 */
export default function PushNotificationWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session?.user)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Don't show anything while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return null
  }

  return <PushNotificationPrompt delay={5000} position="bottom" />
}
