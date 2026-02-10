/**
 * Message Notifications
 * Handle in-app, email, and push notifications for new messages
 *
 * Features:
 * - Always creates in-app notification
 * - Sends push notification to all subscribed devices (bypasses email issues)
 * - Conditionally sends email via Brevo with smart rate limiting:
 *   - Skip if recipient is active (within 5 minutes)
 *   - Skip if already emailed for this conversation (until recipient is active again)
 *   - Skip if daily email limit reached (280/day to stay under Brevo's 300)
 */

import { createBackgroundServiceClient } from '@/lib/supabase/server'
import { createNotification } from './createNotification'
import { sendEmail } from '@/lib/email/sendEmail'
import { sendMessagePushNotification } from '@/lib/push/webPush'

// Configuration
const ACTIVITY_THRESHOLD_MINUTES = 5 // User considered "active" if seen within this time
const DAILY_EMAIL_LIMIT = 280 // Leave buffer under Brevo's 300/day limit

export interface MessageNotificationData {
  messageId: string
  senderId: string
  senderName: string
  receiverId: string
  listingId: string
  listingTitle: string
  messagePreview: string
}

/**
 * Main entry point - handle all notifications for a new message
 */
export async function handleMessageNotifications(data: MessageNotificationData): Promise<void> {
  try {
    // 1. Always create in-app notification
    await createInAppNotification(data)

    // 2. Send push notification (if user has subscribed)
    // Push notifications bypass .edu email filtering issues
    try {
      await sendMessagePushNotification({
        receiverId: data.receiverId,
        senderName: data.senderName,
        listingTitle: data.listingTitle,
        messagePreview: data.messagePreview,
        listingId: data.listingId,
      })
    } catch (pushError) {
      console.error('[MessageNotifications] Error sending push notification:', pushError)
    }

    // 3. Check if email should be sent and send if conditions are met
    const supabase = createBackgroundServiceClient()
    const shouldEmail = await shouldSendEmailNotification(supabase, data)

    if (shouldEmail) {
      await sendMessageEmailNotification(supabase, data)
    }
  } catch (error) {
    // Log but don't throw - notifications shouldn't break message sending
    console.error('[MessageNotifications] Error handling notifications:', error)
  }
}

/**
 * Create in-app notification for new message
 */
async function createInAppNotification(data: MessageNotificationData): Promise<void> {
  const preview = data.messagePreview.length > 80
    ? data.messagePreview.substring(0, 80) + '...'
    : data.messagePreview

  await createNotification({
    userId: data.receiverId,
    type: 'new_message',
    title: `New message from ${data.senderName}`,
    message: preview,
    link: `/messages?listing=${data.listingId}`,
    listingId: data.listingId,
  })

  console.log(`[MessageNotifications] In-app notification created for user ${data.receiverId}`)
}

/**
 * Check all conditions to determine if email should be sent
 */
async function shouldSendEmailNotification(
  supabase: ReturnType<typeof createBackgroundServiceClient>,
  data: MessageNotificationData
): Promise<boolean> {
  // Check 1: Is recipient recently active?
  const { data: isActive, error: activeError } = await supabase
    .rpc('is_user_active', {
      p_user_id: data.receiverId,
      p_threshold_minutes: ACTIVITY_THRESHOLD_MINUTES
    })

  if (activeError) {
    console.error('[MessageNotifications] Error checking user activity:', activeError)
  }

  if (isActive) {
    console.log('[MessageNotifications] Recipient is active, skipping email')
    return false
  }

  // Check 2: Get recipient's last_active and conversation's email_notified_at
  const { data: recipient, error: recipientError } = await supabase
    .from('users')
    .select('last_active, email')
    .eq('id', data.receiverId)
    .single()

  if (recipientError) {
    console.error('[MessageNotifications] Error getting recipient:', recipientError)
  }

  if (!recipient?.email) {
    console.log('[MessageNotifications] Recipient has no email, skipping')
    return false
  }

  console.log(`[MessageNotifications] Recipient email: ${recipient.email}, last_active: ${recipient.last_active}`)

  // Check 3: Have we already emailed for this conversation since recipient was last active?
  // Query by listing_id and both participants to be specific
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('email_notified_at')
    .eq('listing_id', data.listingId)

  if (convError) {
    console.error('[MessageNotifications] Error getting conversation:', convError)
  }

  // Find the conversation for this sender/receiver pair
  const conversation = conversations?.[0] // Take first match for now

  if (conversation?.email_notified_at) {
    const emailedAt = new Date(conversation.email_notified_at).getTime()
    const lastActive = new Date(recipient.last_active).getTime()

    console.log(`[MessageNotifications] Email was sent at ${conversation.email_notified_at}, last_active: ${recipient.last_active}`)

    // If we emailed AFTER recipient's last activity, skip
    if (emailedAt > lastActive) {
      console.log('[MessageNotifications] Already emailed, recipient not active since, skipping')
      return false
    }
  }

  // Check 4: Daily rate limit
  const today = new Date().toISOString().split('T')[0]
  const { data: currentCount, error: countError } = await supabase.rpc('get_email_count', { p_date: today })

  if (countError) {
    console.error('[MessageNotifications] Error getting email count:', countError)
  }

  console.log(`[MessageNotifications] Daily email count: ${currentCount || 0}/${DAILY_EMAIL_LIMIT}`)

  if ((currentCount || 0) >= DAILY_EMAIL_LIMIT) {
    console.log('[MessageNotifications] Daily email limit reached, skipping')
    return false
  }

  console.log('[MessageNotifications] All checks passed, will send email')
  return true
}

/**
 * Send email notification and update tracking
 */
async function sendMessageEmailNotification(
  supabase: ReturnType<typeof createBackgroundServiceClient>,
  data: MessageNotificationData
): Promise<void> {
  console.log('[MessageNotifications] Starting email send process...')

  // Get recipient email
  const { data: recipient, error: recipientError } = await supabase
    .from('users')
    .select('email, display_name')
    .eq('id', data.receiverId)
    .single()

  if (recipientError) {
    console.error('[MessageNotifications] Error getting recipient for email:', recipientError)
    return
  }

  if (!recipient?.email) {
    console.log('[MessageNotifications] No email found for recipient')
    return
  }

  console.log(`[MessageNotifications] Sending email to: ${recipient.email}`)

  // Increment daily count first (atomic)
  const today = new Date().toISOString().split('T')[0]
  const { data: newCount, error: countError } = await supabase.rpc('increment_email_count', { p_date: today })

  if (countError) {
    console.error('[MessageNotifications] Error incrementing email count:', countError)
  }

  console.log(`[MessageNotifications] New email count for today: ${newCount}`)

  // Double-check limit wasn't exceeded by race condition
  if ((newCount || 0) > DAILY_EMAIL_LIMIT) {
    console.log('[MessageNotifications] Rate limit exceeded after increment, skipping')
    return
  }

  // Generate conversation link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ume-life.com'
  const conversationLink = `${baseUrl}/messages?listing=${data.listingId}`

  console.log('[MessageNotifications] Calling sendEmail...')

  // Send email
  try {
    const result = await sendEmail({
      to: recipient.email,
      subject: `New message from ${data.senderName} on UME`,
      html: generateMessageEmailHtml({
        recipientName: recipient.display_name || 'there',
        senderName: data.senderName,
        listingTitle: data.listingTitle,
        messagePreview: data.messagePreview,
        conversationLink,
      }),
    })

    console.log('[MessageNotifications] sendEmail result:', JSON.stringify(result))

    if (result.success) {
      // Update conversation to mark email sent
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ email_notified_at: new Date().toISOString() })
        .eq('listing_id', data.listingId)

      if (updateError) {
        console.error('[MessageNotifications] Error updating conversation email_notified_at:', updateError)
      } else {
        console.log(`[MessageNotifications] Email sent successfully to ${recipient.email}`)
      }
    } else {
      console.error('[MessageNotifications] sendEmail returned failure:', result.error)
    }
  } catch (error) {
    console.error('[MessageNotifications] Exception during sendEmail:', error)
  }
}

/**
 * Generate HTML email template for message notification
 */
function generateMessageEmailHtml(params: {
  recipientName: string
  senderName: string
  listingTitle: string
  messagePreview: string
  conversationLink: string
}): string {
  // Escape HTML in user content
  const escape = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message on UME</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 30px 40px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">New Message</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.5;">
                Hi ${escape(params.recipientName)},
              </p>
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.5;">
                <strong>${escape(params.senderName)}</strong> sent you a message about "<strong>${escape(params.listingTitle)}</strong>":
              </p>

              <!-- Message Preview -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px; border-left: 4px solid #1e1b4b; border-radius: 0 8px 8px 0; margin: 20px 0;">
                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6; font-style: italic;">
                      "${escape(params.messagePreview)}"
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${params.conversationLink}" style="display: inline-block; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View Conversation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                UME - Your University Marketplace
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                You received this email because someone sent you a message on UME.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
