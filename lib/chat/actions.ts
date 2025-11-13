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
