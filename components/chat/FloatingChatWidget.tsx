'use client'

/**
 * Enhanced FloatingChatWidget Component
 *
 * A floating chat widget that replicates ALL features from ChatBox.
 *
 * Features:
 * - Floating button with unread message indicator
 * - Expandable chat window
 * - Real-time messaging
 * - FOR SELLERS: Shows list of buyers and allows selecting which buyer to chat with
 * - FOR BUYERS: Direct messaging with seller
 * - Mobile responsive
 * - Auto-marks messages as read when opened
 */

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, getMessages } from '@/lib/chat/actions'
import { trackEvent } from '@/lib/mixpanel/client'

interface FloatingChatWidgetProps {
  listingId: string
  sellerId: string
  sellerName?: string
  listingTitle?: string
  currentUserId?: string | null
  isOwner?: boolean
}

export default function FloatingChatWidget({
  listingId,
  sellerId,
  sellerName = 'Seller',
  listingTitle = 'Item',
  currentUserId: initialUserId,
  isOwner = false
}: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialUserId || null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<string | null>(null)
  const [buyers, setBuyers] = useState<Map<string, any>>(new Map())
  const [supabase] = useState(() => createClient())
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const previousMessageCountRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get current user if not provided
  useEffect(() => {
    if (!initialUserId) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUserId(user?.id || null)
      })
    }
  }, [supabase, initialUserId])

  // Don't show chat widget if user is not logged in
  // For buyers: don't show if they are the seller
  // For sellers: always show (they need to manage buyer conversations)
  const shouldShowWidget = currentUserId && (isOwner || currentUserId !== sellerId)

  // Load messages
  async function loadMessages() {
    const result = await getMessages(listingId, sellerId)
    if (result.messages) {
      setMessages(result.messages)
    }
  }

  // Real-time subscription
  useEffect(() => {
    if (!currentUserId) return

    console.log('[FloatingWidget] Setting up real-time for listing:', listingId)
    loadMessages()

    const channel = supabase
      .channel('messages:' + listingId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'listing_id=eq.' + listingId,
        },
        async (payload) => {
          console.log('[FloatingWidget] Real-time message received:', payload.new)
          const { data: sender } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single()

          setMessages((prev) => {
            console.log('[FloatingWidget] Adding message to state')
            return [...prev, { ...payload.new, sender }]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: 'listing_id=eq.' + listingId,
        },
        (payload) => {
          console.log('[FloatingWidget] Message updated:', payload.new)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ).filter((msg) => !msg.deleted) // Remove soft-deleted messages
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: 'listing_id=eq.' + listingId,
        },
        (payload) => {
          console.log('[FloatingWidget] Message deleted:', payload.old.id)
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        }
      )
      .subscribe((status) => {
        console.log('[FloatingWidget] Subscription status:', status)
      })

    return () => {
      console.log('[FloatingWidget] Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [listingId, currentUserId, supabase])

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Extract unique buyers from messages (for seller view)
  useEffect(() => {
    if (isOwner && messages.length > 0) {
      const buyersMap = new Map()
      messages.forEach((msg) => {
        // Add buyers (people who are not the current user)
        if (msg.sender_id !== currentUserId && msg.sender) {
          buyersMap.set(msg.sender_id, msg.sender)
        }
      })
      setBuyers(buyersMap)

      // Auto-select first buyer if none selected
      if (!selectedBuyer && buyersMap.size > 0) {
        setSelectedBuyer(Array.from(buyersMap.keys())[0])
      }
    }
  }, [messages, isOwner, currentUserId, selectedBuyer])

  // Calculate unread messages
  useEffect(() => {
    if (!currentUserId) return

    const unread = messages.filter(
      m => m.receiver_id === currentUserId && !m.read
    ).length

    setUnreadCount(unread)

    // Detect new messages (for animation)
    if (messages.length > previousMessageCountRef.current && !isOpen) {
      setHasNewMessages(true)
      setTimeout(() => setHasNewMessages(false), 2000)
    }
    previousMessageCountRef.current = messages.length
  }, [messages, currentUserId, isOpen])

  // Handle send message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId) return

    setLoading(true)

    // Determine who to send the message to
    const receiverId = isOwner
      ? (selectedBuyer || sellerId) // Seller replying to selected buyer
      : sellerId // Buyer sending to seller

    console.log('Sending message:', { listingId, receiverId, messageLength: newMessage.length })
    const result = await sendMessage(listingId, receiverId, newMessage)
    console.log('Send message result:', result)

    if (!result.error) {
      trackEvent('send_message_widget', {
        listing_id: listingId,
        message_length: newMessage.length,
      })
      setNewMessage('')
    } else {
      console.error('Failed to send message:', result.error)
      alert(`Failed to send message: ${result.error}`)
    }
    setLoading(false)
  }

  // Filter messages for selected conversation if owner
  const displayedMessages = isOwner && selectedBuyer
    ? messages.filter(msg =>
        (msg.sender_id === selectedBuyer && msg.receiver_id === currentUserId) ||
        (msg.sender_id === currentUserId && msg.receiver_id === selectedBuyer)
      )
    : messages

  // Don't render if user shouldn't see widget
  if (!shouldShowWidget) return null

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          trackEvent('toggle_chat_widget', { listing_id: listingId, open: !isOpen })
        }}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 z-50 flex items-center justify-center ${
          hasNewMessages ? 'animate-bounce' : ''
        }`}
        aria-label="Open chat"
      >
        {/* Chat Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200 animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-sm">{listingTitle}</h3>
              <p className="text-xs text-blue-100 truncate">
                {isOwner ? 'Messages from Buyers' : `Chat with ${sellerName}`}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded transition-colors ml-2"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Buyer Selection (For Sellers Only) */}
          {isOwner && buyers.size > 0 && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-600 mb-2 font-medium">Select Buyer:</p>
              <div className="flex gap-2 flex-wrap">
                {Array.from(buyers.entries()).map(([buyerId, buyer]) => (
                  <button
                    key={buyerId}
                    onClick={() => setSelectedBuyer(buyerId)}
                    className={
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' +
                      (selectedBuyer === buyerId
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100')
                    }
                  >
                    {buyer.display_name || 'Unknown'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {displayedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm text-center">
                <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>{isOwner ? 'No messages from buyers yet' : 'Start a conversation'}</p>
                <p className="text-xs mt-1">
                  {isOwner ? 'Messages will appear here' : 'Send a message to the seller'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={'flex ' + (message.sender_id === currentUserId ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={'max-w-[75%] rounded-lg px-4 py-2 ' + (
                        message.sender_id === currentUserId
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      )}
                    >
                      {isOwner && message.sender_id !== currentUserId && message.sender && (
                        <p className="text-xs font-semibold mb-1 text-gray-700">
                          {message.sender.display_name}
                        </p>
                      )}
                      <p className="text-sm">{message.body}</p>
                      <p className={'text-xs mt-1 ' + (
                        message.sender_id === currentUserId
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      )}>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  isOwner
                    ? (selectedBuyer ? 'Reply to buyer...' : 'Select a buyer to reply...')
                    : 'Type a message...'
                }
                disabled={loading || (isOwner && !selectedBuyer)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim() || (isOwner && !selectedBuyer)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
