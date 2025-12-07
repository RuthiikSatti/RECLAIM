'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useConversations, type Conversation } from '@/lib/hooks/useConversations'
import { useMessages } from '@/lib/hooks/useMessages'
import MessageBubble from '@/components/chat/MessageBubble'
import { trackEvent } from '@/lib/mixpanel/client'

export default function MessagesPage() {
  const [supabase] = useState(() => createClient())
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [fadingBadges, setFadingBadges] = useState<Set<string>>(new Set())
  const [showMobileConversationView, setShowMobileConversationView] = useState(false)
  const router = useRouter()

  // Enhanced hooks
  const { conversations, loading: conversationsLoading, error: conversationsError } = useConversations()

  const {
    messages,
    loading: messagesLoading,
    sending,
    error: messagesError,
    sendMessage,
    editMessage,
    deleteMessage,
    messagesEndRef
  } = useMessages(
    selectedConversation?.listingId || null,
    selectedConversation?.otherUserId || null,
    {
      autoMarkRead: true,
      autoScroll: true
    }
  )

  // Get current user
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
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [supabase, router])

  // Handle message send
  async function handleSendMessage(e: React.FormEvent, messageText: string) {
    e.preventDefault()
    if (!messageText.trim() || !selectedConversation || !currentUserId) return

    await sendMessage(messageText)

    trackEvent('send_message', {
      listing_id: selectedConversation.listingId,
      message_length: messageText.length,
    })
  }

  // Handle conversation selection
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
    // On mobile, show conversation view
    setShowMobileConversationView(true)
  }

  // Handle back button on mobile
  function handleBackToConversations() {
    setShowMobileConversationView(false)
    setSelectedConversation(null)
  }

  // Handle message edit
  async function handleEditMessage(messageId: string, newBody: string): Promise<boolean> {
    const success = await editMessage(messageId, newBody)

    if (success) {
      trackEvent('edit_message', { message_id: messageId })
    }

    return success
  }

  // Handle message delete
  async function handleDeleteMessage(messageId: string): Promise<boolean> {
    const success = await deleteMessage(messageId)

    if (success) {
      trackEvent('delete_message', { message_id: messageId })
    }

    return success
  }

  // Loading state
  if (conversationsLoading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (conversationsError) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex-1 p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">Error loading conversations: {conversationsError}</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-600 mb-4">No messages yet</p>
            <Link href="/marketplace" className="text-blue-600 hover:text-blue-700 font-medium">
              Browse marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Mobile: Show either conversation list OR message view */}
      <div className="flex-1 flex lg:hidden flex-col overflow-hidden">
        {!showMobileConversationView ? (
          /* Mobile Conversations List */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={`${conversation.listingId}-${conversation.otherUserId}`}
                  onClick={() => handleSelectConversation(conversation)}
                  className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {conversation.listing?.image_urls?.[0] && (
                      <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={conversation.listing.image_urls[0]}
                          alt={conversation.listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {conversation.listing?.title || 'Unknown Listing'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {conversation.otherUser?.display_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Mobile Conversation View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedConversation && (
              <>
                {/* Mobile Header with Back Button */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToConversations}
                      className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 truncate">
                        {selectedConversation.listing?.title || 'Unknown Listing'}
                      </h2>
                      <p className="text-sm text-gray-600 truncate">
                        {selectedConversation.otherUser?.display_name || 'Unknown User'}
                      </p>
                    </div>
                    <Link
                      href={`/item/${selectedConversation.listingId}`}
                      className="text-blue-600 text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {messagesLoading ? (
                    <p className="text-center text-gray-500 py-8">Loading messages...</p>
                  ) : messagesError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm">Error: {messagesError}</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No messages yet</p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwnMessage={message.sender_id === currentUserId}
                          onEdit={handleEditMessage}
                          onDelete={handleDeleteMessage}
                        />
                      ))}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <MessageInput
                  onSend={handleSendMessage}
                  disabled={sending}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Two-column layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

          <div className="grid grid-cols-3 gap-6 h-[calc(100vh-13rem)]">
            {/* Desktop Conversations List */}
            <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Conversations</h2>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
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
                        <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={conversation.listing.image_urls[0]}
                            alt={conversation.listing.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {conversation.listing?.title || 'Unknown Listing'}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {conversation.otherUser?.display_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Messages View */}
            <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-gray-900 truncate">
                          {selectedConversation.listing?.title || 'Unknown Listing'}
                        </h2>
                        <p className="text-sm text-gray-600">
                          with {selectedConversation.otherUser?.display_name || 'Unknown User'}
                        </p>
                      </div>
                      <Link
                        href={`/item/${selectedConversation.listingId}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Listing
                      </Link>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {messagesLoading ? (
                      <p className="text-center text-gray-500 py-8">Loading messages...</p>
                    ) : messagesError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm">Error: {messagesError}</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No messages yet</p>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message) => (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            isOwnMessage={message.sender_id === currentUserId}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                          />
                        ))}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <MessageInput
                    onSend={handleSendMessage}
                    disabled={sending}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-600">Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Message Input Component
function MessageInput({
  onSend,
  disabled
}: {
  onSend: (e: React.FormEvent, text: string) => void
  disabled: boolean
}) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    onSend(e, text)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {disabled ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  )
}
