'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getAllConversations, getMessages, sendMessage, markMessagesAsRead } from '@/lib/chat/actions'
import { trackEvent } from '@/lib/mixpanel/client'
import Navbar from '@/components/layout/Navbar'
import type { Message } from '@/types/database'

interface Conversation {
  listingId: string
  listing: any
  otherUserId: string
  otherUser: any
  lastMessage: string
  lastMessageTime: string
  unread: boolean
}

export default function MessagesPage() {
  const [supabase] = useState(() => createClient())
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (mounted) {
        setCurrentUserId(user.id)
        await loadConversations()
        setLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [supabase, router])

  useEffect(() => {
    if (selectedConversation) {
      loadConversationMessages()
      markMessagesAsRead(selectedConversation.listingId, selectedConversation.otherUserId)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedConversation) return

    // Subscribe to new messages for the selected conversation
    const channel = supabase
      .channel('messages:' + selectedConversation.listingId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'listing_id=eq.' + selectedConversation.listingId,
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single()

          setMessages((prev) => [...prev, { ...payload.new, sender }])

          // Mark as read if we're viewing this conversation
          if (payload.new.receiver_id === currentUserId) {
            await markMessagesAsRead(selectedConversation.listingId, selectedConversation.otherUserId)
          }

          // Reload conversations to update unread status
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, currentUserId, supabase])

  async function loadConversations() {
    const result = await getAllConversations()
    if (result.conversations) {
      setConversations(result.conversations)

      // If we had a selected conversation, update it with the new data
      if (selectedConversation) {
        const updated = result.conversations.find(
          c => c.listingId === selectedConversation.listingId && c.otherUserId === selectedConversation.otherUserId
        )
        if (updated) {
          setSelectedConversation(updated)
        }
      }
    }
  }

  async function loadConversationMessages() {
    if (!selectedConversation) return

    const result = await getMessages(selectedConversation.listingId, selectedConversation.otherUserId)
    if (result.messages) {
      setMessages(result.messages)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return

    setSending(true)

    const result = await sendMessage(
      selectedConversation.listingId,
      selectedConversation.otherUserId,
      newMessage
    )

    if (!result.error) {
      trackEvent('send_message', {
        listing_id: selectedConversation.listingId,
        message_length: newMessage.length,
      })
      setNewMessage('')
      loadConversations() // Refresh to update last message
    }

    setSending(false)
  }

  function handleSelectConversation(conversation: Conversation) {
    setSelectedConversation(conversation)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-black">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-black mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-black mb-4">No messages yet</p>
            <Link href="/marketplace" className="text-blue-600 hover:text-blue-700 underline">
              Browse marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-black">Conversations</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <button
                    key={`${conversation.listingId}-${conversation.otherUserId}`}
                    onClick={() => handleSelectConversation(conversation)}
                    className={
                      'w-full p-4 text-left hover:bg-gray-50 transition-colors ' +
                      (selectedConversation?.listingId === conversation.listingId &&
                      selectedConversation?.otherUserId === conversation.otherUserId
                        ? 'bg-blue-50'
                        : '')
                    }
                  >
                    <div className="flex items-start gap-3">
                      {conversation.listing?.image_urls?.[0] && (
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={conversation.listing.image_urls[0]}
                            alt={conversation.listing.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-black text-sm truncate">
                            {conversation.listing?.title || 'Unknown Listing'}
                          </p>
                          {conversation.unread && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {conversation.otherUser?.display_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conversation.lastMessageTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages View */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-black">
                          {selectedConversation.listing?.title || 'Unknown Listing'}
                        </h2>
                        <p className="text-sm text-gray-600">
                          with {selectedConversation.otherUser?.display_name || 'Unknown User'}
                        </p>
                      </div>
                      <Link
                        href={`/item/${selectedConversation.listingId}`}
                        className="text-blue-600 hover:text-blue-700 text-sm underline"
                      >
                        View Listing
                      </Link>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <p className="text-center text-gray-500">No messages yet</p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={
                            'flex ' +
                            (message.sender_id === currentUserId ? 'justify-end' : 'justify-start')
                          }
                        >
                          <div
                            className={
                              'max-w-xs lg:max-w-md rounded-lg px-4 py-2 ' +
                              (message.sender_id === currentUserId
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-black')
                            }
                          >
                            <p className="text-sm break-words">{message.body}</p>
                            <p
                              className={
                                'text-xs mt-1 ' +
                                (message.sender_id === currentUserId
                                  ? 'text-blue-100'
                                  : 'text-gray-500')
                              }
                            >
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a conversation to view messages
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
