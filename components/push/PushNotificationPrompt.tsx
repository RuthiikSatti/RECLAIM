'use client'

import { useState, useEffect } from 'react'
import usePushNotifications from '@/hooks/usePushNotifications'

// Simple SVG icons to avoid external dependencies
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

interface PushNotificationPromptProps {
  /** Delay before showing the prompt (ms) */
  delay?: number
  /** Where to position the prompt */
  position?: 'top' | 'bottom'
}

/**
 * Push Notification Opt-in Prompt
 *
 * Shows a friendly prompt asking users to enable push notifications.
 * Only shows if:
 * - Push notifications are supported
 * - User hasn't already subscribed
 * - User hasn't dismissed the prompt recently
 */
export default function PushNotificationPrompt({
  delay = 3000,
  position = 'bottom',
}: PushNotificationPromptProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    error,
  } = usePushNotifications()

  // Check if prompt was dismissed recently
  useEffect(() => {
    const dismissedAt = localStorage.getItem('push-prompt-dismissed')
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      if (dismissedTime > oneDayAgo) {
        setIsDismissed(true)
      }
    }
  }, [])

  // Show prompt after delay if conditions are met
  useEffect(() => {
    if (!isSupported || isSubscribed || isDismissed || permission === 'denied') {
      return
    }

    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [isSupported, isSubscribed, isDismissed, permission, delay])

  // Handle enable button click
  const handleEnable = async () => {
    const success = await subscribe()
    if (success) {
      setIsVisible(false)
    }
  }

  // Handle dismiss
  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem('push-prompt-dismissed', Date.now().toString())
  }

  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`fixed ${position === 'top' ? 'top-4' : 'bottom-4'} left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-400">
              <BellIcon />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Enable Notifications
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss"
          >
            <XIcon />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Get notified instantly when someone sends you a message about your listings.
        </p>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 mb-3">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Enabling...' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
