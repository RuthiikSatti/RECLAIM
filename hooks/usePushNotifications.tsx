'use client'

import { useState, useEffect, useCallback } from 'react'

// VAPID public key from environment
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

export interface UsePushNotificationsReturn {
  /** Current permission state */
  permission: PushPermissionState
  /** Whether the browser supports push notifications */
  isSupported: boolean
  /** Whether push notifications are currently enabled */
  isSubscribed: boolean
  /** Loading state for subscribe/unsubscribe operations */
  isLoading: boolean
  /** Request permission and subscribe to push notifications */
  subscribe: () => Promise<boolean>
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>
  /** Error message if any */
  error: string | null
}

/**
 * Convert a base64 string to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray.buffer
}

/**
 * Hook for managing push notification subscriptions
 */
export default function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermissionState>('prompt')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if push notifications are supported
  const isSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID_PUBLIC_KEY

  // Check current permission and subscription status on mount
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported')
      return
    }

    // Check notification permission
    setPermission(Notification.permission as PushPermissionState)

    // Check if already subscribed
    checkSubscription()
  }, [isSupported])

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!isSupported) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (err) {
      console.error('[Push] Error checking subscription:', err)
    }
  }, [isSupported])

  // Register service worker
  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported')
    }

    // Register or get existing registration
    let registration = await navigator.serviceWorker.getRegistration()

    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })
      console.log('[Push] Service worker registered')
    }

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready

    return registration
  }

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !VAPID_PUBLIC_KEY) {
      setError('Push notifications not supported')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Register service worker first
      const registration = await registerServiceWorker()

      // Request notification permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult as PushPermissionState)

      if (permissionResult !== 'granted') {
        setError('Notification permission denied')
        return false
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      console.log('[Push] Subscribed:', subscription)

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save subscription')
      }

      setIsSubscribed(true)
      console.log('[Push] Subscription saved to server')
      return true
    } catch (err: any) {
      console.error('[Push] Subscribe error:', err)
      setError(err.message || 'Failed to subscribe')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        setIsSubscribed(false)
        return true
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe()

      // Remove from server
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      })

      if (!response.ok) {
        console.warn('[Push] Server unsubscribe failed, but local unsubscribe succeeded')
      }

      setIsSubscribed(false)
      console.log('[Push] Unsubscribed successfully')
      return true
    } catch (err: any) {
      console.error('[Push] Unsubscribe error:', err)
      setError(err.message || 'Failed to unsubscribe')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    error,
  }
}
