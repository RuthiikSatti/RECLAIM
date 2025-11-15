/**
 * useMessages Hook
 *
 * Manages messages for a specific conversation with real-time updates and optimistic UI.
 * Features:
 * - Fetches messages for conversation
 * - Real-time subscriptions to message INSERT/UPDATE/DELETE
 * - Optimistic updates for send/edit/delete operations
 * - Auto-scroll to bottom on new messages
 * - Visibility-aware mark-as-read (only when page is visible)
 * - Deduplication using client IDs
 *
 * Usage:
 * const {
 *   messages,
 *   loading,
 *   sending,
 *   sendMessage,
 *   editMessage,
 *   deleteMessage,
 *   markAsRead,
 *   messagesEndRef
 * } = useMessages(listingId, otherUserId)
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getMessagesEnhanced,
  sendMessageEnhanced,
  editMessageEnhanced,
  deleteMessageEnhanced,
  markMessagesAsReadEnhanced
} from '@/lib/chat/enhanced-actions'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Message {
  id: string
  listing_id: string
  sender_id: string
  receiver_id: string
  body: string
  created_at: string
  read: boolean
  delivered_at: string | null
  seen_at: string | null
  edited: boolean
  deleted: boolean
  updated_at: string
  sender?: any
  clientId?: string // For optimistic updates
  optimistic?: boolean // Flag for optimistic messages
}

interface UseMessagesOptions {
  autoMarkRead?: boolean // Auto-mark messages as read when visible (default: true)
  autoScroll?: boolean // Auto-scroll to bottom on new messages (default: true)
}

interface UseMessagesReturn {
  messages: Message[]
  loading: boolean
  sending: boolean
  error: string | null
  sendMessage: (body: string) => Promise<void>
  editMessage: (messageId: string, newBody: string) => Promise<boolean>
  deleteMessage: (messageId: string) => Promise<boolean>
  markAsRead: () => Promise<void>
  messagesEndRef: React.RefObject<HTMLDivElement>
  refetch: () => Promise<void>
}

export function useMessages(
  listingId: string | null,
  otherUserId: string | null,
  options: UseMessagesOptions = {}
): UseMessagesReturn {
  const { autoMarkRead = true, autoScroll = true } = options

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const mountedRef = useRef(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasMarkedReadRef = useRef(false)

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [autoScroll])

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && mountedRef.current) {
        setCurrentUserId(user.id)
      }
    })
  }, [supabase])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!listingId || !otherUserId) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      const result = await getMessagesEnhanced(listingId, otherUserId)

      if (!mountedRef.current) return

      if (result.error) {
        setError(result.error)
        setMessages([])
      } else {
        // Filter out optimistic messages that now have real IDs
        setMessages(prevMessages => {
          const realMessages = result.messages || []
          const realIds = new Set(realMessages.map(m => m.id))

          // Keep optimistic messages that haven't been confirmed yet
          const optimisticMessages = prevMessages.filter(
            m => m.optimistic && !realIds.has(m.id)
          )

          return [...realMessages, ...optimisticMessages]
        })
      }
    } catch (err: any) {
      if (!mountedRef.current) return
      console.error('Error fetching messages:', err)
      setError(err.message || 'Failed to load messages')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [listingId, otherUserId])

  // Mark messages as read (visibility-aware)
  const markAsRead = useCallback(async () => {
    if (!listingId || !otherUserId || !currentUserId) return
    if (hasMarkedReadRef.current) return // Already marked

    // Only mark as read if page is visible
    if (document.visibilityState !== 'visible') {
      console.log('[useMessages] Page not visible, skipping mark as read')
      return
    }

    try {
      hasMarkedReadRef.current = true
      await markMessagesAsReadEnhanced(listingId, otherUserId)

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.receiver_id === currentUserId && !msg.read
            ? { ...msg, read: true, seen_at: new Date().toISOString() }
            : msg
        )
      )
    } catch (err) {
      console.error('Error marking messages as read:', err)
      hasMarkedReadRef.current = false // Allow retry
    }
  }, [listingId, otherUserId, currentUserId])

  // Send message with optimistic update
  const sendMessage = useCallback(async (body: string) => {
    if (!listingId || !otherUserId || !currentUserId || !body.trim()) return

    setSending(true)
    const clientId = `client-${Date.now()}-${Math.random()}`

    // Optimistic message
    const optimisticMessage: Message = {
      id: clientId,
      listing_id: listingId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      body: body.trim(),
      created_at: new Date().toISOString(),
      read: false,
      delivered_at: null,
      seen_at: null,
      edited: false,
      deleted: false,
      updated_at: new Date().toISOString(),
      clientId,
      optimistic: true
    }

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage])
    scrollToBottom()

    try {
      const result = await sendMessageEnhanced(listingId, otherUserId, body, clientId)

      if (result.error) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== clientId))
        setError(result.error)
      } else if (result.message) {
        // Replace optimistic message with real one
        setMessages(prev =>
          prev.map(m =>
            m.id === clientId ? { ...result.message!, optimistic: false } : m
          )
        )
        scrollToBottom()
      }
    } catch (err: any) {
      console.error('Error sending message:', err)
      setMessages(prev => prev.filter(m => m.id !== clientId))
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }, [listingId, otherUserId, currentUserId, scrollToBottom])

  // Edit message with optimistic update
  const editMessage = useCallback(async (
    messageId: string,
    newBody: string
  ): Promise<boolean> => {
    if (!newBody.trim()) return false

    // Optimistic update
    const previousMessages = messages
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? { ...m, body: newBody.trim(), edited: true, updated_at: new Date().toISOString() }
          : m
      )
    )

    try {
      const result = await editMessageEnhanced(messageId, newBody)

      if (result.error) {
        // Revert on error
        setMessages(previousMessages)
        setError(result.error)
        return false
      }

      return true
    } catch (err: any) {
      console.error('Error editing message:', err)
      setMessages(previousMessages)
      setError(err.message || 'Failed to edit message')
      return false
    }
  }, [messages])

  // Delete message with optimistic update
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    // Optimistic update
    const previousMessages = messages
    setMessages(prev => prev.filter(m => m.id !== messageId))

    try {
      const result = await deleteMessageEnhanced(messageId)

      if (result.error) {
        // Revert on error
        setMessages(previousMessages)
        setError(result.error)
        return false
      }

      return true
    } catch (err: any) {
      console.error('Error deleting message:', err)
      setMessages(previousMessages)
      setError(err.message || 'Failed to delete message')
      return false
    }
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    if (!listingId || !otherUserId || !currentUserId) return

    mountedRef.current = true
    fetchMessages()

    // Subscribe to messages for this conversation
    const channel = supabase
      .channel(`messages:${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listingId}`
        },
        async (payload) => {
          const newMessage = payload.new as Message

          // Ignore if this is an optimistic message we already have
          setMessages(prev => {
            const exists = prev.some(
              m => m.id === newMessage.id || m.clientId === newMessage.clientId
            )
            if (exists) return prev

            // Only add if part of this conversation
            const isRelevant =
              (newMessage.sender_id === currentUserId && newMessage.receiver_id === otherUserId) ||
              (newMessage.sender_id === otherUserId && newMessage.receiver_id === currentUserId)

            if (!isRelevant) return prev

            return [...prev, newMessage]
          })

          scrollToBottom()

          // Auto-mark as read if we're the receiver and page is visible
          if (newMessage.receiver_id === currentUserId && autoMarkRead) {
            setTimeout(() => markAsRead(), 500)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listingId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message

          setMessages(prev =>
            prev.map(m =>
              m.id === updatedMessage.id ? { ...m, ...updatedMessage, optimistic: false } : m
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listingId}`
        },
        (payload) => {
          const deletedId = payload.old.id

          setMessages(prev => prev.filter(m => m.id !== deletedId))
        }
      )
      .subscribe((status) => {
        console.log('[useMessages] Subscription status:', status)
      })

    channelRef.current = channel

    return () => {
      mountedRef.current = false
      hasMarkedReadRef.current = false

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [listingId, otherUserId, currentUserId, supabase, fetchMessages, scrollToBottom, markAsRead, autoMarkRead])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-mark as read when component is visible
  useEffect(() => {
    if (!autoMarkRead || !listingId || !otherUserId) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markAsRead()
      }
    }

    // Mark as read on mount if visible
    if (document.visibilityState === 'visible') {
      setTimeout(() => markAsRead(), 1000)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [autoMarkRead, listingId, otherUserId, markAsRead])

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    messagesEndRef,
    refetch: fetchMessages
  }
}
