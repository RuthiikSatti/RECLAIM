'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, getMessages } from '@/lib/chat/actions'
import { trackEvent } from '@/lib/mixpanel/client'
import type { Message } from '@/types/database'

interface ChatBoxProps {
  listingId: string
  sellerId: string
  currentUserId: string
  isOwner?: boolean
}

export default function ChatBox({ listingId, sellerId, currentUserId, isOwner = false }: ChatBoxProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<string | null>(null)
  const [buyers, setBuyers] = useState<Map<string, any>>(new Map())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
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
          const { data: sender } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single()

          setMessages((prev) => [...prev, { ...payload.new, sender }])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listingId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Extract unique buyers from messages (for seller view)
    if (isOwner && messages.length > 0) {
      const buyersMap = new Map()
      messages.forEach((msg) => {
        // Add buyers (people who are not the current user)
        if (msg.sender_id !== currentUserId && msg.sender) {
          buyersMap.set(msg.sender_id, msg.sender)
        }
        // Also check receiver in case seller sent a message back
        if (msg.receiver_id !== currentUserId && msg.receiver_id) {
          // We might not have the receiver object, so skip if not available
          // In a full implementation, we'd fetch this
        }
      })
      setBuyers(buyersMap)

      // Auto-select first buyer if none selected
      if (!selectedBuyer && buyersMap.size > 0) {
        setSelectedBuyer(Array.from(buyersMap.keys())[0])
      }
    }
  }, [messages, isOwner, currentUserId, selectedBuyer])

  async function loadMessages() {
    const result = await getMessages(listingId, sellerId)
    if (result.messages) {
      setMessages(result.messages)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return

    setLoading(true)

    // Determine who to send the message to
    const receiverId = isOwner
      ? (selectedBuyer || sellerId) // Seller replying to selected buyer
      : sellerId // Buyer sending to seller

    console.log('Sending message:', { listingId, receiverId, messageLength: newMessage.length })
    const result = await sendMessage(listingId, receiverId, newMessage)
    console.log('Send message result:', result)

    if (!result.error) {
      trackEvent('send_message', {
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

  return (
    <div className="flex flex-col h-96">
      {isOwner && buyers.size > 0 && (
        <div className="mb-3 flex gap-2 flex-wrap">
          {Array.from(buyers.entries()).map(([buyerId, buyer]) => (
            <button
              key={buyerId}
              onClick={() => setSelectedBuyer(buyerId)}
              className={
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors ' +
                (selectedBuyer === buyerId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200')
              }
            >
              {buyer.display_name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg mb-4">
        {displayedMessages.length === 0 && (
          <p className="text-center text-black">
            {isOwner ? 'No messages from buyers yet' : 'No messages yet'}
          </p>
        )}
        {displayedMessages.map((message) => (
          <div
            key={message.id}
            className={'flex ' + (message.sender_id === currentUserId ? 'justify-end' : 'justify-start')}
          >
            <div
              className={'max-w-xs rounded-lg px-4 py-2 ' + (
                message.sender_id === currentUserId
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-black'
              )}
            >
              {isOwner && message.sender_id !== currentUserId && (
                <p className="text-xs font-semibold mb-1 text-black">
                  {message.sender?.display_name}
                </p>
              )}
              <p className="text-sm">{message.body}</p>
              <p className={'text-xs mt-1 ' + (message.sender_id === currentUserId ? 'text-blue-100' : 'text-black')}>
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={
            isOwner
              ? (selectedBuyer ? 'Reply to buyer...' : 'Select a buyer to reply...')
              : 'Type a message...'
          }
          disabled={isOwner && !selectedBuyer}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim() || (isOwner && !selectedBuyer)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}
