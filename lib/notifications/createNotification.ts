/**
 * Notification Helper Functions
 * Create in-app notifications for users
 */

import { createServiceClient, createBackgroundServiceClient } from '@/lib/supabase/server'

export interface NotificationData {
  userId: string
  type: string
  title: string
  message: string
  link?: string
  orderId?: string
  listingId?: string
}

/**
 * Create a notification in the database
 * Uses background service client to work in fire-and-forget contexts
 */
export async function createNotification(data: NotificationData) {
  try {
    const supabase = createBackgroundServiceClient()

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        order_id: data.orderId,
        listing_id: data.listingId,
        read: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return { success: false, error }
    }

    console.log('Notification created:', notification.id)
    return { success: true, data: notification }
  } catch (error: any) {
    console.error('Exception creating notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create buyer payment success notification
 */
export async function notifyBuyerPaymentSuccess({
  buyerId,
  orderId,
  listingId,
  listingTitle,
  amount,
}: {
  buyerId: string
  orderId: string
  listingId: string
  listingTitle: string
  amount: number
}) {
  const priceFormatted = `$${(amount / 100).toFixed(2)}`

  return createNotification({
    userId: buyerId,
    type: 'payment_success',
    title: '✅ Payment Confirmed',
    message: `Your payment of ${priceFormatted} for "${listingTitle}" was successful. The seller will ship your item soon.`,
    link: `/orders/${orderId}`,
    orderId,
    listingId,
  })
}

/**
 * Create seller item sold notification
 */
export async function notifySellerItemSold({
  sellerId,
  orderId,
  listingId,
  listingTitle,
  amount,
  buyerName,
}: {
  sellerId: string
  orderId: string
  listingId: string
  listingTitle: string
  amount: number
  buyerName: string
}) {
  const priceFormatted = `$${(amount / 100).toFixed(2)}`
  const platformFee = amount * 0.10
  const sellerPayout = amount - platformFee
  const sellerPayoutFormatted = `$${(sellerPayout / 100).toFixed(2)}`

  return createNotification({
    userId: sellerId,
    type: 'item_sold',
    title: '💰 You Made a Sale!',
    message: `${buyerName} purchased "${listingTitle}" for ${priceFormatted}. You'll receive ${sellerPayoutFormatted}. Please ship the item.`,
    link: `/orders/${orderId}`,
    orderId,
    listingId,
  })
}

/**
 * Create order shipped notification for buyer
 */
export async function notifyBuyerOrderShipped({
  buyerId,
  orderId,
  listingId,
  listingTitle,
  trackingNumber,
}: {
  buyerId: string
  orderId: string
  listingId: string
  listingTitle: string
  trackingNumber: string
}) {
  return createNotification({
    userId: buyerId,
    type: 'order_shipped',
    title: '📦 Your Order Has Shipped',
    message: `"${listingTitle}" is on its way! Tracking: ${trackingNumber}`,
    link: `/orders/${orderId}`,
    orderId,
    listingId,
  })
}

/**
 * Create order delivered notification
 */
export async function notifyBuyerOrderDelivered({
  buyerId,
  orderId,
  listingId,
  listingTitle,
}: {
  buyerId: string
  orderId: string
  listingId: string
  listingTitle: string
}) {
  return createNotification({
    userId: buyerId,
    type: 'order_delivered',
    title: '✅ Order Delivered',
    message: `"${listingTitle}" has been delivered. Enjoy your purchase!`,
    link: `/orders/${orderId}`,
    orderId,
    listingId,
  })
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createServiceClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Exception marking notification as read:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const supabase = await createServiceClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Exception marking all notifications as read:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = await createServiceClient()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Error getting unread count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Exception getting unread count:', error)
    return 0
  }
}
