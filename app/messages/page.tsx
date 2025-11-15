'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getAllConversations, getMessages, sendMessage, markMessagesAsRead, deleteMessage, editMessage } from '@/lib/chat/actions'
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
  unreadCount: number
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
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedText, setEditedText] = useState('')
  const [fadingBadges, setFadingBadges] = useState<Set<string>>(new Set())
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: 'listing_id=eq.' + selectedConversation.listingId,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          )
          loadConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: 'listing_id=eq.' + selectedConversation.listingId,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, currentUserId, supabase])

  // Global real-time subscription for all messages to update unread counts
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Reload conversations whenever any message changes
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, supabase])

  // Typing indicator listener
  useEffect(() => {
    if (!selectedConversation || !currentUserId) return

    const channel = supabase
      .channel('typing:' + selectedConversation.listingId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_indicators',
          filter: 'listing_id=eq.' + selectedConversation.listingId,
        },
        (payload) => {
          // Show typing indicator if it's from the other user
          if (payload.new.user_id === selectedConversation.otherUserId) {
            setOtherUserTyping(true)

            // Auto-hide after 3 seconds
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current)
            }
            typingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(false)
            }, 3000)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'typing_indicators',
          filter: 'listing_id=eq.' + selectedConversation.listingId,
        },
        (payload) => {
          if (payload.old.user_id === selectedConversation.otherUserId) {
            setOtherUserTyping(false)
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      setOtherUserTyping(false)
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
    // If the conversation has unread messages, trigger fade-out animation
    if (conversation.unreadCount > 0) {
      const key = `${conversation.listingId}-${conversation.otherUserId}`
      setFadingBadges(prev => new Set(prev).add(key))

      // Remove from fading set after animation completes
      setTimeout(() => {
        setFadingBadges(prev => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }, 300) // Match animation duration
    }

    setSelectedConversation(conversation)
  }

  async function handleDeleteMessage(messageId: string) {
    if (!confirm('Are you sure you want to delete this message?')) {
      return
    }

    const result = await deleteMessage(messageId)
    if (!result.error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      loadConversations() // Update last message in conversations
      trackEvent('delete_message', { message_id: messageId })
    } else {
      alert('Failed to delete message: ' + result.error)
    }
  }

  function handleStartEdit(message: any) {
    setEditingMessageId(message.id)
    setEditedText(message.body)
  }

  async function handleSaveEdit(messageId: string) {
    if (!editedText.trim()) {
      alert('Message cannot be empty')
      return
    }

    const result = await editMessage(messageId, editedText)
    if (!result.error) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, body: editedText } : m))
      )
      setEditingMessageId(null)
      setEditedText('')
      loadConversations() // Update last message in conversations
      trackEvent('edit_message', { message_id: messageId })
    } else {
      alert('Failed to edit message: ' + result.error)
    }
  }

  function handleCancelEdit() {
    setEditingMessageId(null)
    setEditedText('')
  }

  async function handleTyping() {
    if (!selectedConversation || !currentUserId) return

    try {
      // Upsert typing indicator
      await supabase
        .from('typing_indicators')
        .upsert({
          listing_id: selectedConversation.listingId,
          user_id: currentUserId,
        }, {
          onConflict: 'listing_id,user_id'
        })

      // Auto-delete after 2 seconds
      setTimeout(async () => {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('listing_id', selectedConversation.listingId)
          .eq('user_id', currentUserId)
      }, 2000)
    } catch (error) {
      console.error('Error updating typing indicator:', error)
    }
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
                          {(conversation.unreadCount > 0 || fadingBadges.has(`${conversation.listingId}-${conversation.otherUserId}`)) && (
                            <span className={
                              'flex-shrink-0 min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 ' +
                              (fadingBadges.has(`${conversation.listingId}-${conversation.otherUserId}`) ? 'animate-fade-out' : 'animate-fade-in')
                            }>
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-black mb-1">
                          {conversation.otherUser?.display_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-black truncate">
                          {conversation.lastMessage}
                        </p>
                        <p className="text-xs text-black mt-1">
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
                      <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={
                            'flex group ' +
                            (message.sender_id === currentUserId ? 'justify-end' : 'justify-start')
                          }
                          onMouseEnter={() => setHoveredMessageId(message.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          <div className="flex items-start gap-2">
                            {message.sender_id === currentUserId && (
                              <div className={
                                'flex gap-1 mt-1 transition-opacity duration-200 ' +
                                (hoveredMessageId === message.id && editingMessageId !== message.id ? 'opacity-100' : 'opacity-0')
                              }>
                                <button
                                  onClick={() => handleStartEdit(message)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  title="Edit message"
                                >
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                  title="Delete message"
                                >
                                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                            <div
                              className={
                                'max-w-xs lg:max-w-md rounded-lg px-4 py-2 ' +
                                (message.sender_id === currentUserId
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-black')
                              }
                            >
                              {editingMessageId === message.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveEdit(message.id)}
                                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
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
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {otherUserTyping && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-black rounded-lg px-4 py-2 max-w-xs">
                            <div className="flex gap-1 items-center">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      </>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value)
                          handleTyping()
                        }}
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
