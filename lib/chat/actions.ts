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
    .select('*, sender:users!messages_sender_id_fkey(*), receiver:users!messages_receiver_id_fkey(*), listing:listings(*)')
    .or('sender_id.eq.' + user.id + ',receiver_id.eq.' + user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { conversations: [], error: error.message }
  }

  // Group messages by listing and other user
  const conversationsMap = new Map()

  messages?.forEach((message: any) => {
    const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id
    const otherUser = message.sender_id === user.id ? message.receiver : message.sender
    const key = `${message.listing_id}-${otherUserId}`

    if (!conversationsMap.has(key)) {
      conversationsMap.set(key, {
        listingId: message.listing_id,
        listing: message.listing,
        otherUserId,
        otherUser,
        lastMessage: message.body,
        lastMessageTime: message.created_at,
        unread: message.receiver_id === user.id && !message.read,
      })
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
