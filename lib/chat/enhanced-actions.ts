/**
 * Enhanced Chat Server Actions
 *
 * These server actions use Supabase service role for secure message operations.
 * IMPORTANT: Service role key must ONLY be used server-side, never exposed to client.
 *
 * Features:
 * - Mark messages as read with seen_at timestamp
 * - Edit messages with edit tracking
 * - Delete messages (soft delete)
 * - Send messages with delivery tracking
 * - Fetch conversations with accurate unread counts
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { handleMessageNotifications } from '@/lib/notifications/messageNotifications'

// Create service role client (server-side only)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// ============================================================================
// MARK MESSAGES AS READ (WITH SEEN TIMESTAMP)
// ============================================================================

/**
 * Mark all unread messages in a conversation as read.
 * Sets is_read=true and seen_at=NOW() for recipient's messages.
 *
 * @param conversationId - UUID of the conversation
 * @param listingId - UUID of the listing
 * @param otherUserId - UUID of the other participant
 * @returns Updated conversation with new unread count
 */
export async function markMessagesAsReadEnhanced(
  listingId: string,
  otherUserId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    // Use service role client for reliable updates
    const serviceClient = getServiceClient()

    // Mark messages as read and set seen_at
    const { error: updateError } = await serviceClient
      .from('messages')
      .update({
        read: true,
        seen_at: new Date().toISOString()
      })
      .eq('listing_id', listingId)
      .eq('receiver_id', user.id)
      .eq('sender_id', otherUserId)
      .eq('read', false)
      .eq('deleted', false)

    if (updateError) {
      console.error('Error marking messages as read:', updateError)
      return { error: updateError.message }
    }

    // Fetch updated conversation to return new unread count
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('listing_id', listingId)
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .single()

    if (convError && convError.code !== 'PGRST116') {
      console.error('Error fetching conversation:', convError)
    }

    return {
      success: true,
      conversation,
      markedCount: 0 // Triggers will handle count updates
    }
  } catch (error: any) {
    console.error('Error in markMessagesAsReadEnhanced:', error)
    return { error: error.message || 'Failed to mark messages as read' }
  }
}

// ============================================================================
// SEND MESSAGE WITH DELIVERY TRACKING
// ============================================================================

/**
 * Send a new message with automatic delivery timestamp.
 * delivered_at is set by database trigger on insert.
 *
 * @param listingId - UUID of the listing
 * @param receiverId - UUID of the recipient
 * @param body - Message text content
 * @param clientId - Optional client-generated ID for optimistic updates
 * @returns Created message object
 */
export async function sendMessageEnhanced(
  listingId: string,
  receiverId: string,
  body: string,
  clientId?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (!body.trim()) {
    return { error: 'Message cannot be empty' }
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        listing_id: listingId,
        sender_id: user.id,
        receiver_id: receiverId,
        body: body.trim(),
        read: false,
        deleted: false,
        edited: false
        // delivered_at is set automatically by trigger
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(*),
        listing:listings!messages_listing_id_fkey(title)
      `)
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return { error: error.message }
    }

    // Trigger notifications (in-app + conditional email)
    // Must await to ensure email sends before serverless function terminates
    try {
      await handleMessageNotifications({
        messageId: data.id,
        senderId: user.id,
        senderName: data.sender?.display_name || data.sender?.username || 'Someone',
        receiverId,
        listingId,
        listingTitle: data.listing?.title || 'a listing',
        messagePreview: body.trim(),
      })
    } catch (err) {
      // Don't fail the message send if notifications fail
      console.error('Error handling message notifications:', err)
    }

    return {
      message: {
        ...data,
        clientId // Include client ID for optimistic update reconciliation
      }
    }
  } catch (error: any) {
    console.error('Error in sendMessageEnhanced:', error)
    return { error: error.message || 'Failed to send message' }
  }
}

// ============================================================================
// EDIT MESSAGE
// ============================================================================

/**
 * Edit an existing message.
 * Sets edited=true and updates updated_at timestamp.
 * Only allows editing messages sent within last 2 minutes.
 *
 * @param messageId - UUID of the message to edit
 * @param newBody - New message text
 * @returns Updated message object
 */
export async function editMessageEnhanced(
  messageId: string,
  newBody: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (!newBody.trim()) {
    return { error: 'Message cannot be empty' }
  }

  try {
    // Use service role to bypass RLS for timestamp check
    const serviceClient = getServiceClient()

    // Get the message to verify ownership and timing
    const { data: message, error: fetchError } = await serviceClient
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (fetchError || !message) {
      return { error: 'Message not found' }
    }

    // Verify sender
    if (message.sender_id !== user.id) {
      return { error: 'Unauthorized to edit this message' }
    }

    // Check if message is within 2-minute edit window
    const messageAge = Date.now() - new Date(message.created_at).getTime()
    const twoMinutesInMs = 2 * 60 * 1000

    if (messageAge > twoMinutesInMs) {
      return { error: 'Message can only be edited within 2 minutes of sending' }
    }

    // Don't allow editing deleted messages
    if (message.deleted) {
      return { error: 'Cannot edit deleted message' }
    }

    // Update the message
    const { data, error } = await serviceClient
      .from('messages')
      .update({
        body: newBody.trim(),
        edited: true
        // updated_at is set automatically by trigger
      })
      .eq('id', messageId)
      .select(`
        *,
        sender:users!messages_sender_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error('Error editing message:', error)
      return { error: error.message }
    }

    return { message: data }
  } catch (error: any) {
    console.error('Error in editMessageEnhanced:', error)
    return { error: error.message || 'Failed to edit message' }
  }
}

// ============================================================================
// DELETE MESSAGE (SOFT DELETE)
// ============================================================================

/**
 * Soft delete a message by setting deleted=true.
 * Message remains in database but is filtered from queries.
 *
 * @param messageId - UUID of the message to delete
 * @returns Success status
 */
export async function deleteMessageEnhanced(messageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    const serviceClient = getServiceClient()

    // Get the message to verify ownership
    const { data: message, error: fetchError } = await serviceClient
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (fetchError || !message) {
      return { error: 'Message not found' }
    }

    // Verify sender
    if (message.sender_id !== user.id) {
      return { error: 'Unauthorized to delete this message' }
    }

    // Already deleted
    if (message.deleted) {
      return { success: true }
    }

    // Soft delete
    const { error } = await serviceClient
      .from('messages')
      .update({ deleted: true })
      .eq('id', messageId)

    if (error) {
      console.error('Error deleting message:', error)
      return { error: error.message }
    }

    return { success: true, messageId }
  } catch (error: any) {
    console.error('Error in deleteMessageEnhanced:', error)
    return { error: error.message || 'Failed to delete message' }
  }
}

// ============================================================================
// GET CONVERSATIONS WITH UNREAD COUNTS
// ============================================================================

/**
 * Fetch all conversations for current user with accurate unread counts.
 * Uses conversations table for efficient unread count retrieval.
 *
 * @returns Array of conversations with metadata
 */
export async function getConversationsEnhanced() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { conversations: [] }
  }

  try {
    // Fetch conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(*),
        participant_1:users!conversations_participant_1_id_fkey(*),
        participant_2:users!conversations_participant_2_id_fkey(*),
        last_message:messages!conversations_last_message_id_fkey(*)
      `)
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return { error: error.message, conversations: [] }
    }

    // Transform conversations to include otherUser and user's unread count
    const transformedConversations = conversations?.map(conv => {
      const isParticipant1 = conv.participant_1_id === user.id
      const otherUser = isParticipant1 ? conv.participant_2 : conv.participant_1
      const unreadCount = isParticipant1
        ? conv.participant_1_unread_count
        : conv.participant_2_unread_count

      return {
        id: conv.id,
        listingId: conv.listing_id,
        listing: conv.listing,
        otherUserId: otherUser.id,
        otherUser,
        lastMessage: conv.last_message?.body || '',
        lastMessageTime: conv.last_message_at,
        unreadCount,
        updatedAt: conv.updated_at
      }
    }) || []

    return { conversations: transformedConversations }
  } catch (error: any) {
    console.error('Error in getConversationsEnhanced:', error)
    return { error: error.message, conversations: [] }
  }
}

// ============================================================================
// GET MESSAGES FOR CONVERSATION
// ============================================================================

/**
 * Fetch all messages for a specific conversation.
 * Filters out soft-deleted messages.
 *
 * @param listingId - UUID of the listing
 * @param otherUserId - UUID of the other participant
 * @returns Array of messages with delivery/seen status
 */
export async function getMessagesEnhanced(
  listingId: string,
  otherUserId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', messages: [] }
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(*)
      `)
      .eq('listing_id', listingId)
      .eq('deleted', false)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return { error: error.message, messages: [] }
    }

    return { messages: data || [] }
  } catch (error: any) {
    console.error('Error in getMessagesEnhanced:', error)
    return { error: error.message, messages: [] }
  }
}

// ============================================================================
// HELPER: GET TOTAL UNREAD COUNT FOR USER
// ============================================================================

/**
 * Get total unread message count across all conversations for current user.
 *
 * @returns Total unread count
 */
export async function getTotalUnreadCountEnhanced() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { count: 0 }
  }

  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('participant_1_id, participant_1_unread_count, participant_2_id, participant_2_unread_count')
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)

    if (error) {
      console.error('Error fetching unread count:', error)
      return { count: 0 }
    }

    // Sum up unread counts for this user
    const totalUnread = conversations?.reduce((sum, conv) => {
      if (conv.participant_1_id === user.id) {
        return sum + conv.participant_1_unread_count
      } else if (conv.participant_2_id === user.id) {
        return sum + conv.participant_2_unread_count
      }
      return sum
    }, 0) || 0

    return { count: totalUnread }
  } catch (error: any) {
    console.error('Error in getTotalUnreadCountEnhanced:', error)
    return { count: 0 }
  }
}
