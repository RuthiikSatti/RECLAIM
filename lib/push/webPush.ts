/**
 * Web Push Notification Service
 * Sends push notifications to subscribed browsers using the Web Push protocol
 */

import webpush from 'web-push'
import { getUserPushSubscriptions, removeSubscription } from './subscriptionManager'

// Configure web-push with VAPID keys
// Generate keys with: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:umelife.official@gmail.com'

// Only set VAPID details if keys are configured
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
}

/**
 * Send push notification to all subscribed devices for a user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  // Check if VAPID keys are configured
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log('[Push] VAPID keys not configured, skipping push notification')
    return { sent: 0, failed: 0 }
  }

  // Get all subscriptions for this user
  const subscriptions = await getUserPushSubscriptions(userId)

  if (subscriptions.length === 0) {
    console.log(`[Push] No subscriptions found for user ${userId}`)
    return { sent: 0, failed: 0 }
  }

  console.log(`[Push] Sending to ${subscriptions.length} device(s) for user ${userId}`)

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload),
          {
            TTL: 60 * 60, // 1 hour TTL
            urgency: 'high',
          }
        )
        console.log(`[Push] Sent to endpoint: ${sub.endpoint.substring(0, 50)}...`)
        return { success: true, endpoint: sub.endpoint }
      } catch (error: any) {
        console.error(`[Push] Failed to send to endpoint:`, error.statusCode, error.body)

        // If subscription is expired or invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[Push] Removing expired subscription: ${sub.endpoint.substring(0, 50)}...`)
          await removeSubscription(userId, sub.endpoint)
        }

        throw error
      }
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  console.log(`[Push] Results: ${sent} sent, ${failed} failed`)

  return { sent, failed }
}

/**
 * Send push notification for a new message
 */
export async function sendMessagePushNotification(params: {
  receiverId: string
  senderName: string
  listingTitle: string
  messagePreview: string
  listingId: string
}): Promise<void> {
  const { receiverId, senderName, listingTitle, messagePreview, listingId } = params

  // Truncate message preview
  const preview = messagePreview.length > 100
    ? messagePreview.substring(0, 100) + '...'
    : messagePreview

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ume-life.com'

  await sendPushNotification(receiverId, {
    title: `New message from ${senderName}`,
    body: preview,
    url: `${baseUrl}/messages?listing=${listingId}`,
    tag: `message-${listingId}`, // Group notifications by conversation
  })
}
