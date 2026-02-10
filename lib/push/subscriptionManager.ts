/**
 * Push Subscription Manager
 * Handles storing and retrieving push subscriptions from the database
 */

import { createBackgroundServiceClient } from '@/lib/supabase/server'

export interface PushSubscriptionRecord {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
  created_at: string
  last_used_at?: string
}

/**
 * Save a push subscription for a user
 */
export async function saveSubscription(
  userId: string,
  subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  },
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createBackgroundServiceClient()

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,endpoint',
      }
    )

  if (error) {
    console.error('[Push] Error saving subscription:', error)
    return { success: false, error: error.message }
  }

  console.log(`[Push] Subscription saved for user ${userId}`)
  return { success: true }
}

/**
 * Remove a push subscription
 */
export async function removeSubscription(
  userId: string,
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createBackgroundServiceClient()

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  if (error) {
    console.error('[Push] Error removing subscription:', error)
    return { success: false, error: error.message }
  }

  console.log(`[Push] Subscription removed for user ${userId}`)
  return { success: true }
}

/**
 * Get all push subscriptions for a user
 */
export async function getUserPushSubscriptions(
  userId: string
): Promise<PushSubscriptionRecord[]> {
  const supabase = createBackgroundServiceClient()

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('[Push] Error getting subscriptions:', error)
    return []
  }

  return data || []
}

/**
 * Check if a user has any push subscriptions
 */
export async function hasSubscription(userId: string): Promise<boolean> {
  const subscriptions = await getUserPushSubscriptions(userId)
  return subscriptions.length > 0
}

/**
 * Update last_used_at timestamp for a subscription
 */
export async function updateSubscriptionLastUsed(
  userId: string,
  endpoint: string
): Promise<void> {
  const supabase = createBackgroundServiceClient()

  await supabase
    .from('push_subscriptions')
    .update({ last_used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
}

/**
 * Remove all subscriptions for a user (e.g., on logout)
 */
export async function removeAllSubscriptions(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createBackgroundServiceClient()

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('[Push] Error removing all subscriptions:', error)
    return { success: false, error: error.message }
  }

  console.log(`[Push] All subscriptions removed for user ${userId}`)
  return { success: true }
}
