'use client'

/**
 * MessagesPage - Rebuilt for clean, polished UI
 *
 * Features:
 * - Two-column layout: conversation list (left) + chat area (right)
 * - Search/filter conversations
 * - Avatar placeholders with initials
 * - Clean message bubbles with timestamps
 * - Message input with emoji picker and microphone icons (placeholders)
 * - Fully accessible with keyboard navigation and ARIA labels
 * - Responsive design with mobile-first approach
 *
 * NOTE: All business logic (Supabase realtime, message sending) preserved from original
 */

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
  const [searchQuery, setSearchQuery] = useState('')
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

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Generate avatar initials
  function getInitials(name: string | undefined): string {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Loading state
  if (conversationsLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (conversationsError) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <p className="text-red-800 text-sm">Error loading conversations: {conversationsError}</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <svg
              className="w-20 h-20 mx-auto mb-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No messages yet</h2>
            <p className="text-gray-600 mb-6">Start a conversation by contacting a seller on a listing</p>
            <Link
              href="/marketplace"
              className="inline-block bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile: Show either conversation list OR message view */}
      <div className="flex-1 flex md:hidden flex-col overflow-hidden bg-white">
        {!showMobileConversationView ? (
          /* Mobile Conversations List */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>

              {/* Search */}
              <div className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm"
                  aria-label="Search conversations"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No conversations found
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={`${conversation.listingId}-${conversation.otherUserId}`}
                    onClick={() => handleSelectConversation(conversation)}
                    className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-start gap-3"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conversation.listing?.image_urls?.[0] ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                          <Image
                            src={conversation.listing.image_urls[0]}
                            alt={conversation.listing.title}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">
                          {getInitials(conversation.otherUser?.display_name)}
                        </div>
                      )}
                      {conversation.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {conversation.listing?.title || 'Unknown Listing'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {conversation.otherUser?.display_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                ))
              )}
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
                      className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900"
                      aria-label="Back to conversations"
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
                      className="text-blue-600 text-sm font-medium hover:text-blue-700 focus:outline-none focus:underline"
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
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
                      <p className="text-red-800 text-sm">Error: {messagesError}</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</p>
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
      <div className="hidden md:flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Left Column - Conversations List */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>

            {/* Search */}
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm"
                aria-label="Search conversations"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No conversations found
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isSelected = selectedConversation?.listingId === conversation.listingId &&
                                   selectedConversation?.otherUserId === conversation.otherUserId

                return (
                  <button
                    key={`${conversation.listingId}-${conversation.otherUserId}`}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`
                      w-full p-4 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors flex items-start gap-3
                      ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                    `}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conversation.listing?.image_urls?.[0] ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                          <Image
                            src={conversation.listing.image_urls[0]}
                            alt={conversation.listing.title}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">
                          {getInitials(conversation.otherUser?.display_name)}
                        </div>
                      )}
                      {conversation.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {conversation.listing?.title || 'Unknown Listing'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {conversation.otherUser?.display_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column - Chat Area */}
        <div className="flex-1 bg-white flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold flex-shrink-0">
                      {getInitials(selectedConversation.otherUser?.display_name)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-900 truncate">
                        {selectedConversation.listing?.title || 'Unknown Listing'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        with {selectedConversation.otherUser?.display_name || 'Unknown User'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/item/${selectedConversation.listingId}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none focus:underline"
                  >
                    View Listing
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {messagesLoading ? (
                  <p className="text-center text-gray-500 py-8">Loading messages...</p>
                ) : messagesError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
                    <p className="text-red-800 text-sm">Error: {messagesError}</p>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</p>
                ) : (
                  <div className="space-y-3 max-w-3xl mx-auto">
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
                <svg
                  className="w-20 h-20 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-gray-600 text-lg">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Message Input Component with emoji and mic icons (placeholders)
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
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        {/* Emoji Button (TODO: Add emoji picker) */}
        <button
          type="button"
          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 flex-shrink-0"
          aria-label="Add emoji"
          title="Add emoji (coming soon)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
          disabled={disabled}
          aria-label="Message input"
        />

        {/* Mic Button (TODO: Add voice recording) */}
        <button
          type="button"
          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 flex-shrink-0"
          aria-label="Voice message"
          title="Voice message (coming soon)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 flex-shrink-0"
          aria-label="Send message"
        >
          {disabled ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  )
}
