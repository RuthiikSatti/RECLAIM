/**
 * Service Worker for Push Notifications
 * Handles receiving and displaying browser push notifications
 */

// Cache name for offline support (optional)
const CACHE_NAME = 'ume-v1'

// Install event - service worker is being installed
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed')
  self.skipWaiting()
})

// Activate event - service worker is now active
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated')
  event.waitUntil(clients.claim())
})

// Push event - received a push notification from server
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)

  let data = {
    title: 'New Message',
    body: 'You have a new message on UME',
    url: '/messages'
  }

  // Parse the push data if available
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      console.error('[SW] Error parsing push data:', e)
    }
  }

  const options = {
    body: data.body,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/messages',
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'View Message'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ],
    // Show notification even if app is in focus
    requireInteraction: false,
    // Tag to prevent duplicate notifications
    tag: data.tag || 'ume-message'
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click event - user clicked on the notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  // Handle the click action
  if (event.action === 'close') {
    return
  }

  // Default action or 'open' action - open the URL
  const urlToOpen = event.notification.data?.url || '/messages'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate the existing window
            client.navigate(urlToOpen)
            return client.focus()
          }
        }
        // No existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Notification close event (optional - for analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed')
})

// Handle push subscription change (e.g., when browser refreshes subscription)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed')

  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        // Send new subscription to server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        })
      })
  )
})
