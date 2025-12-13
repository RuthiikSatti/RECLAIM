/**
 * Conversation Management Utilities
 *
 * Helper functions for creating and managing conversations.
 */

'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get or create a conversation between two users for a specific listing.
 *
 * @param currentUserId - The ID of the current user (buyer)
 * @param otherUserId - The ID of the other user (seller)
 * @param listingId - The ID of the listing
 * @returns The conversation ID or error
 */
export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
  listingId: string
): Promise<{ conversationId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    // Normalize participant order: smaller UUID first
    // This ensures consistent ordering regardless of who initiates
    const [participant1, participant2] = [currentUserId, otherUserId].sort()

    // Try to find existing conversation
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('participant_1_id', participant1)
      .eq('participant_2_id', participant2)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching conversation:', fetchError)
      return { error: 'Failed to fetch conversation' }
    }

    // If conversation exists, return it
    if (existingConversation) {
      return { conversationId: existingConversation.id }
    }

    // Create new conversation
    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId,
        participant_1_id: participant1,
        participant_2_id: participant2,
        participant_1_unread_count: 0,
        participant_2_unread_count: 0
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating conversation:', insertError)
      return { error: 'Failed to create conversation' }
    }

    return { conversationId: newConversation.id }
  } catch (error: any) {
    console.error('Unexpected error in getOrCreateConversation:', error)
    return { error: error.message || 'An unexpected error occurred' }
  }
}
