'use client'

/**
 * MessagesPage - Clean messaging interface matching design screenshot
 *
 * Layout:
 * - Left sidebar: "Chats" header with + button, search bar, conversation list
 * - Right area: Selected conversation with messages
 * - Clean, minimal design with checkmarks for read receipts
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useConversations, type Conversation } from '@/lib/hooks/useConversations'
import { useMessages } from '@/lib/hooks/useMessages'
import MessageBubble from '@/components/chat/MessageBubble'
import { trackEvent } from '@/lib/mixpanel/client'

function MessagesPageContent() {
  const [supabase] = useState(() => createClient())
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileConversationView, setShowMobileConversationView] = useState(false)
  const [prefillText, setPrefillText] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()

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

  // Get current user and handle prefill
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

        // Handle prefill query parameter
        const prefillParam = searchParams.get('prefill')
        if (prefillParam) {
          try {
            const decoded = decodeURIComponent(prefillParam)
            setPrefillText(decoded)
          } catch (e) {
            console.error('Failed to decode prefill:', e)
          }
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [supabase, router, searchParams])

  // Auto-select conversation based on conversationId query parameter
  useEffect(() => {
    const conversationIdParam = searchParams.get('conversationId')

    if (conversationIdParam && conversations.length > 0 && !selectedConversation) {
      // Find the conversation by ID
      const conversation = conversations.find(conv => conv.id === conversationIdParam)

      if (conversation) {
        setSelectedConversation(conversation)
        setShowMobileConversationView(true)
      }
    }
  }, [searchParams, conversations, selectedConversation])

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
    setSelectedConversation(conversation)
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

  // Filter conversations
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
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (conversationsError) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md" role="alert">
          <p className="text-red-800 text-sm">Error loading conversations: {conversationsError}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center p-4">
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
            className="inline-block bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile: Show either conversation list OR message view */}
      <div className="flex md:hidden w-full">
        {!showMobileConversationView ? (
          // Mobile conversation list
          <div className="flex-1 flex flex-col bg-white">
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-black">Chats</h1>
                <button
                  className="w-8 h-8 flex items-center justify-center text-black hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="New conversation"
                  title="New conversation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  aria-label="Search conversations"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button
                  key={`${conv.listingId}-${conv.otherUserId}`}
                  onClick={() => handleSelectConversation(conv)}
                  className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-semibold flex-shrink-0">
                    {getInitials(conv.otherUser?.display_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-black text-sm mb-0.5">
                      {conv.otherUser?.display_name || 'Unknown User'} - {conv.listing?.title || 'Unknown Listing'}
                    </div>
                    <div className="text-sm text-gray-600 truncate flex items-center gap-1">
                      {conv.unreadCount === 0 && <span className="text-gray-400">✓✓</span>}
                      <span className="truncate">{conv.lastMessage || 'No messages yet'}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Mobile conversation view
          <div className="flex-1 flex flex-col bg-white">
            {selectedConversation && (
              <>
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToConversations}
                      className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
                      aria-label="Back to conversations"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                      {getInitials(selectedConversation.otherUser?.display_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-black truncate">
                        {selectedConversation.otherUser?.display_name || 'Unknown User'} - {selectedConversation.listing?.title}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {messagesLoading ? (
                    <p className="text-center text-gray-500 py-8">Loading...</p>
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

                <MessageInput onSend={handleSendMessage} disabled={sending} initialText={prefillText} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Two-column layout */}
      <div className="hidden md:flex w-full max-w-7xl mx-auto">
        {/* Left Sidebar - Chats List */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-black">Chats</h1>
              <button
                className="w-8 h-8 flex items-center justify-center text-black hover:bg-gray-100 rounded-full transition-colors"
                aria-label="New conversation"
                title="New conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                aria-label="Search conversations"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No conversations found
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.listingId === conv.listingId &&
                                   selectedConversation?.otherUserId === conv.otherUserId

                return (
                  <button
                    key={`${conv.listingId}-${conv.otherUserId}`}
                    onClick={() => handleSelectConversation(conv)}
                    className={`
                      w-full p-4 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors
                      ${isSelected ? 'bg-gray-100' : ''}
                    `}
                  >
                    <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-semibold flex-shrink-0">
                      {getInitials(conv.otherUser?.display_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-black text-sm mb-0.5">
                        {conv.otherUser?.display_name || 'Unknown User'} - {conv.listing?.title || 'Unknown Listing'}
                      </div>
                      <div className="text-sm text-gray-600 truncate flex items-center gap-1">
                        {conv.unreadCount === 0 && <span className="text-gray-400">✓✓</span>}
                        <span className="truncate">{conv.lastMessage || 'No messages yet'}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Panel - Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold flex-shrink-0">
                    {getInitials(selectedConversation.otherUser?.display_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-black">
                      {selectedConversation.otherUser?.display_name || 'Unknown User'} - {selectedConversation.listing?.title}
                    </h2>
                  </div>
                  <Link
                    href={`/item/${selectedConversation.listingId}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Listing
                  </Link>
                </div>
              </div>

              {/* Messages Area */}
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

              {/* Message Input */}
              <MessageInput onSend={handleSendMessage} disabled={sending} initialText={prefillText} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg
                  className="w-20 h-20 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-600">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Message Input Component
function MessageInput({
  onSend,
  disabled,
  initialText = ''
}: {
  onSend: (e: React.FormEvent, text: string) => void
  disabled: boolean
  initialText?: string
}) {
  const [text, setText] = useState(initialText)

  // Update text when initialText changes (prefill support)
  useEffect(() => {
    if (initialText && initialText !== text) {
      setText(initialText)
    }
  }, [initialText])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(e, text)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
      <div className="flex gap-2 items-center">
        <button
          type="button"
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full flex-shrink-0"
          aria-label="Add attachment"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder=""
          className="flex-1 px-4 py-2.5 border-0 focus:outline-none text-gray-900 bg-white"
          disabled={disabled}
        />

        <button
          type="button"
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full flex-shrink-0"
          aria-label="Add emoji"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button
          type="button"
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full flex-shrink-0"
          aria-label="Voice message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>
    </form>
  )
}

// Export default component with Suspense boundary
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}
