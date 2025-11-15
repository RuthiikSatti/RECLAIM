'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendMessage(listingId: string, receiverId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      listing_id: listingId,
      sender_id: user.id,
      receiver_id: receiverId,
      body,
      read: false,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { message: data }
}

export async function getMessages(listingId: string, otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(*)')
    .eq('listing_id', listingId)
    .or('sender_id.eq.' + user.id + ',receiver_id.eq.' + user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { messages: data }
}

export async function getUnreadMessageCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { count: 0 }
  }

  // Count messages where current user is the receiver and read is false
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('read', false)

  if (error) {
    return { count: 0 }
  }

  return { count: count || 0 }
}

export async function getAllConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { conversations: [] }
  }

  // Get all messages involving the current user
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .or('sender_id.eq.' + user.id + ',receiver_id.eq.' + user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { conversations: [], error: error.message }
  }

  if (!messages || messages.length === 0) {
    return { conversations: [] }
  }

  // Get unique user IDs and listing IDs
  const userIds = new Set<string>()
  const listingIds = new Set<string>()

  messages.forEach((message: any) => {
    userIds.add(message.sender_id)
    userIds.add(message.receiver_id)
    listingIds.add(message.listing_id)
  })

  // Fetch all users and listings in batch
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .in('id', Array.from(userIds))

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .in('id', Array.from(listingIds))

  // Create lookup maps
  const usersMap = new Map(users?.map(u => [u.id, u]) || [])
  const listingsMap = new Map(listings?.map(l => [l.id, l]) || [])

  // Group messages by listing and other user, and count unread messages
  const conversationsMap = new Map()

  messages.forEach((message: any) => {
    const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id
    const otherUser = usersMap.get(otherUserId)
    const listing = listingsMap.get(message.listing_id)
    const key = `${message.listing_id}-${otherUserId}`

    if (!conversationsMap.has(key)) {
      conversationsMap.set(key, {
        listingId: message.listing_id,
        listing,
        otherUserId,
        otherUser,
        lastMessage: message.body,
        lastMessageTime: message.created_at,
        unreadCount: 0,
      })
    }

    // Count unread messages for this conversation
    const conversation = conversationsMap.get(key)
    if (message.receiver_id === user.id && !message.read) {
      conversation.unreadCount++
    }
  })

  return { conversations: Array.from(conversationsMap.values()) }
}

export async function markMessagesAsRead(listingId: string, otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Mark all messages as read where current user is the receiver
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('listing_id', listingId)
    .eq('receiver_id', user.id)
    .eq('sender_id', otherUserId)
    .eq('read', false)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Get the message first to verify ownership
  const { data: message } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single()

  if (!message) {
    return { error: 'Message not found' }
  }

  // Only the sender can delete their own messages
  if (message.sender_id !== user.id) {
    return { error: 'Unauthorized to delete this message' }
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function editMessage(messageId: string, newBody: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (!newBody.trim()) {
    return { error: 'Message cannot be empty' }
  }

  // Get the message first to verify ownership
  const { data: message } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single()

  if (!message) {
    return { error: 'Message not found' }
  }

  // Only the sender can edit their own messages
  if (message.sender_id !== user.id) {
    return { error: 'Unauthorized to edit this message' }
  }

  const { data, error } = await supabase
    .from('messages')
    .update({ body: newBody })
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { message: data }
}
