'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useConversations, type Conversation } from '@/lib/hooks/useConversations'
import { useMessages } from '@/lib/hooks/useMessages'
import { trackEvent } from '@/lib/mixpanel/client'
import { reportConversation, deleteConversation } from '@/lib/chat/conversation-actions'

function MessagesPageContent() {
  const [supabase] = useState(() => createClient())
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileConversationView, setShowMobileConversationView] = useState(false)
  const [prefillText, setPrefillText] = useState<string>('')
  const [showInfoDropdown, setShowInfoDropdown] = useState(false)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null)
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
      autoScroll: false
    }
  )

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const prevMessagesCount = useRef<number>(0)
  const userScrolledUpRef = useRef<boolean>(false)


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

  // Auto-select conversation
  useEffect(() => {
    const conversationIdParam = searchParams.get('conversationId')

    if (conversationIdParam && conversations.length > 0 && !selectedConversation) {
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

  function handleSelectConversation(conversation: Conversation) {
    setSelectedConversation(conversation)
    setShowMobileConversationView(true)
  }

  function handleBackToConversations() {
    setShowMobileConversationView(false)
    setSelectedConversation(null)
  }

  async function handleEditMessage(messageId: string, newBody: string): Promise<boolean> {
    const success = await editMessage(messageId, newBody)
    if (success) {
      trackEvent('edit_message', { message_id: messageId })
    }
    return success
  }

  async function handleDeleteMessage(messageId: string): Promise<boolean> {
    const success = await deleteMessage(messageId)
    if (success) {
      trackEvent('delete_message', { message_id: messageId })
    }
    setShowMessageMenu(null)
    return success
  }

  async function handleReportChat() {
    if (!selectedConversation) return

    const reason = prompt('Please provide a reason for reporting this chat:')
    if (!reason || !reason.trim()) return

    const result = await reportConversation(
      selectedConversation.listingId,
      selectedConversation.otherUserId,
      reason
    )

    if (result.error) {
      alert('Failed to report chat: ' + result.error)
    } else {
      alert('Chat reported successfully. Our team will review it.')
      trackEvent('report_chat', { listing_id: selectedConversation.listingId })
    }

    setShowInfoDropdown(false)
  }

  async function handleDeleteChat() {
    if (!selectedConversation) return

    const confirmed = confirm(
      'Are you sure you want to delete this chat? This will permanently delete all messages in this conversation.'
    )
    if (!confirmed) return

    const result = await deleteConversation(
      selectedConversation.listingId,
      selectedConversation.otherUserId
    )

    if (result.error) {
      alert('Failed to delete chat: ' + result.error)
    } else {
      trackEvent('delete_chat', { listing_id: selectedConversation.listingId })
      setShowInfoDropdown(false)
      setSelectedConversation(null)
      setShowMobileConversationView(false)
    }
  }

  function handleStartEdit(message: any) {
    setEditingMessageId(message.id)
    setEditingText(message.body)
    setShowMessageMenu(null)
  }

  function handleCancelEdit() {
    setEditingMessageId(null)
    setEditingText('')
  }

  async function handleSaveEdit(messageId: string) {
    const success = await handleEditMessage(messageId, editingText)
    if (success) {
      setEditingMessageId(null)
      setEditingText('')
    }
  }

  function canEditOrDelete(message: any): boolean {
    // Can't edit/delete if message has been seen by the other person
    return message.seen_at === null
  }

  const filteredConversations = conversations.filter(conv =>
    conv.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function getInitials(name: string | undefined): string {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Scroll detection
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const onScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      const atBottom = distanceFromBottom < 150
      userScrolledUpRef.current = !atBottom
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      container.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Reset scroll position when conversation changes
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container && selectedConversation) {
      // Start at top of messages
      container.scrollTop = 0
      prevMessagesCount.current = 0
    }
  }, [selectedConversation?.id])

  // Auto-scroll only when user sends a message
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || messages.length === 0) {
      prevMessagesCount.current = messages.length
      return
    }

    const prevCount = prevMessagesCount.current
    const newCount = messages.length

    // Only scroll when a new message is added and it's from the current user
    if (newCount > prevCount && newCount > 0) {
      const lastMsg = messages[messages.length - 1]
      const isOwnMessage = lastMsg?.sender_id === currentUserId

      if (isOwnMessage) {
        setTimeout(() => {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
        }, 50)
      }
    }

    prevMessagesCount.current = newCount
  }, [messages, currentUserId])

  if (conversationsLoading) {
    return (
      <div className="flex h-screen bg-ume-bg items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (conversationsError) {
    return (
      <div className="flex h-screen bg-ume-bg items-center justify-center p-4">
        <div className="bg-white border border-black rounded-lg p-4 max-w-md" role="alert">
          <p className="text-black text-sm">Error loading conversations: {conversationsError}</p>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-screen bg-ume-bg items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-ume-indigo mb-2">No messages yet</h2>
          <p className="text-gray-600 mb-6">Start a conversation by contacting a seller on a listing</p>
          <Link
            href="/marketplace"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-ume-bg overflow-hidden">
      {/* Mobile */}
      <div className="flex md:hidden w-full">
        {!showMobileConversationView ? (
          <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-ume-indigo mb-3">Messages</h1>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black text-black"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button
                  key={`${conv.listingId}-${conv.otherUserId}`}
                  onClick={() => handleSelectConversation(conv)}
                  className="w-full p-3 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                    {getInitials(conv.otherUser?.display_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-black text-sm mb-1">
                      {conv.otherUser?.display_name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {conv.lastMessage || 'No messages yet'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white h-screen">
            {selectedConversation && (
              <>
                <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={handleBackToConversations}
                    className="p-1 hover:bg-gray-100 rounded-full"
                    aria-label="Back"
                  >
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                    {getInitials(selectedConversation.otherUser?.display_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-black text-sm">
                      {selectedConversation.otherUser?.display_name || 'Unknown User'}
                    </div>
                    <div className="text-xs text-gray-500">{selectedConversation.listing?.title}</div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowInfoDropdown(!showInfoDropdown)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
                      aria-label="Chat options"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {showInfoDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowInfoDropdown(false)}
                        />
                        <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                          <Link
                            href={`/item/${selectedConversation.listingId}`}
                            className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100 transition-colors block"
                            onClick={() => setShowInfoDropdown(false)}
                          >
                            View Listing
                          </Link>
                          <button
                            onClick={handleReportChat}
                            className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100 transition-colors"
                          >
                            Report Chat
                          </button>
                          <button
                            onClick={handleDeleteChat}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 transition-colors"
                          >
                            Delete Chat
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-scroll px-4 py-4 bg-white min-h-0"
                >
                  {messagesLoading ? (
                    <p className="text-center text-gray-500 py-8">Loading...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No messages yet</p>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((message, index) => {
                        const isOwn = message.sender_id === currentUserId
                        const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id
                        const isEditing = editingMessageId === message.id
                        const canEdit = isOwn && canEditOrDelete(message)

                        return (
                          <div
                            key={message.id}
                            className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                            onTouchStart={() => isOwn && setHoveredMessageId(message.id)}
                          >
                            {!isOwn && (
                              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                                {getInitials(selectedConversation.otherUser?.display_name)}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              {isOwn && hoveredMessageId === message.id && !isEditing && (
                                <div className="relative">
                                  <button
                                    onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                                    className="p-1 text-gray-500 active:text-black transition-colors"
                                    aria-label="Message options"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <circle cx="10" cy="4" r="1.5" />
                                      <circle cx="10" cy="10" r="1.5" />
                                      <circle cx="10" cy="16" r="1.5" />
                                    </svg>
                                  </button>
                                  {showMessageMenu === message.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowMessageMenu(null)}
                                      />
                                      <div className="absolute right-0 top-6 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                        <button
                                          onClick={() => handleStartEdit(message)}
                                          disabled={!canEdit}
                                          className={`w-full px-4 py-2 text-left text-sm ${
                                            canEdit
                                              ? 'text-black active:bg-gray-100'
                                              : 'text-gray-400 cursor-not-allowed'
                                          } transition-colors`}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMessage(message.id)}
                                          disabled={!canEdit}
                                          className={`w-full px-4 py-2 text-left text-sm ${
                                            canEdit
                                              ? 'text-red-600 active:bg-gray-100'
                                              : 'text-gray-400 cursor-not-allowed'
                                          } transition-colors`}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                              <div className="flex flex-col gap-1">
                                {isEditing ? (
                                  <div className="flex flex-col gap-2 max-w-[280px]">
                                    <input
                                      type="text"
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      className="w-full px-4 py-2 bg-gray-100 rounded-3xl text-sm focus:outline-none text-black"
                                      autoFocus
                                    />
                                    <div className="flex items-center gap-2 justify-end">
                                      <button
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1 bg-gray-200 text-black text-xs rounded-full"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSaveEdit(message.id)}
                                        className="px-3 py-1 bg-black text-white text-xs rounded-full"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div
                                      className={`px-4 py-2 rounded-3xl text-sm break-words ${
                                        isOwn
                                          ? 'bg-ume-indigo text-white max-w-[280px]'
                                          : 'bg-gray-200 text-black max-w-[280px]'
                                      }`}
                                      style={{ wordBreak: 'break-word' }}
                                    >
                                      {message.body}
                                    </div>
                                    {message.edited && (
                                      <span className="text-xs text-gray-400 px-2">
                                        Edited {new Date(message.updated_at).toLocaleString()}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <MessageInput onSend={handleSendMessage} disabled={sending} initialText={prefillText} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:flex w-full h-full">
        {/* Left Sidebar */}
        <div className="w-96 border-r border-gray-200 flex flex-col bg-white h-full">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-ume-indigo mb-4">Messages</h1>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black text-black"
            />
          </div>

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
                    className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors ${
                      isSelected ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                      {getInitials(conv.otherUser?.display_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-black text-sm mb-1">
                        {conv.otherUser?.display_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {conv.lastMessage || 'No messages yet'}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col bg-white h-full">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold flex-shrink-0">
                  {getInitials(selectedConversation.otherUser?.display_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-black">
                    {selectedConversation.otherUser?.display_name || 'Unknown User'}
                  </div>
                  <div className="text-xs text-gray-500">{selectedConversation.listing?.title}</div>
                </div>
                <div className="relative">
                    <button
                      onClick={() => setShowInfoDropdown(!showInfoDropdown)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
                      aria-label="Chat options"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {showInfoDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowInfoDropdown(false)}
                        />
                        <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                          <Link
                            href={`/item/${selectedConversation.listingId}`}
                            className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100 transition-colors block"
                            onClick={() => setShowInfoDropdown(false)}
                          >
                            View Listing
                          </Link>
                          <button
                            onClick={handleReportChat}
                            className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100 transition-colors"
                          >
                            Report Chat
                          </button>
                          <button
                            onClick={handleDeleteChat}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 transition-colors"
                          >
                            Delete Chat
                          </button>
                        </div>
                      </>
                    )}
                  </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-scroll px-8 py-6 bg-white min-h-0"
              >
                {messagesLoading ? (
                  <p className="text-center text-gray-500 py-8">Loading messages...</p>
                ) : messagesError ? (
                  <div className="bg-white border border-black rounded-lg p-4" role="alert">
                    <p className="text-black text-sm">Error: {messagesError}</p>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No messages yet</p>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-2">
                    {messages.map((message, index) => {
                      const isOwn = message.sender_id === currentUserId
                      const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id
                      const isEditing = editingMessageId === message.id
                      const canEdit = isOwn && canEditOrDelete(message)

                      return (
                        <div
                          key={message.id}
                          className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}
                          onMouseEnter={() => isOwn && setHoveredMessageId(message.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          {!isOwn && (
                            <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                              {getInitials(selectedConversation.otherUser?.display_name)}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            {isOwn && hoveredMessageId === message.id && !isEditing && (
                              <div className="relative">
                                <button
                                  onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                                  className="p-1 text-gray-500 hover:text-black transition-colors"
                                  aria-label="Message options"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <circle cx="10" cy="4" r="1.5" />
                                    <circle cx="10" cy="10" r="1.5" />
                                    <circle cx="10" cy="16" r="1.5" />
                                  </svg>
                                </button>
                                {showMessageMenu === message.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setShowMessageMenu(null)}
                                    />
                                    <div className="absolute right-0 top-6 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                      <button
                                        onClick={() => handleStartEdit(message)}
                                        disabled={!canEdit}
                                        className={`w-full px-4 py-2 text-left text-sm ${
                                          canEdit
                                            ? 'text-black hover:bg-gray-100'
                                            : 'text-gray-400 cursor-not-allowed'
                                        } transition-colors`}
                                        title={!canEdit ? 'Cannot edit after message is viewed' : ''}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMessage(message.id)}
                                        disabled={!canEdit}
                                        className={`w-full px-4 py-2 text-left text-sm ${
                                          canEdit
                                            ? 'text-red-600 hover:bg-gray-100'
                                            : 'text-gray-400 cursor-not-allowed'
                                        } transition-colors`}
                                        title={!canEdit ? 'Cannot delete after message is viewed' : ''}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              {isEditing ? (
                                <div className="flex flex-col gap-2 max-w-[450px]">
                                  <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-100 rounded-3xl text-sm focus:outline-none text-black"
                                    autoFocus
                                  />
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-3 py-1 bg-gray-200 text-black text-xs rounded-full hover:bg-gray-300"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveEdit(message.id)}
                                      className="px-3 py-1 bg-black text-white text-xs rounded-full hover:bg-gray-800"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div
                                    className={`px-4 py-2 rounded-3xl break-words ${
                                      isOwn
                                        ? 'bg-ume-indigo text-white max-w-[450px]'
                                        : 'bg-gray-200 text-black max-w-[450px]'
                                    }`}
                                    style={{ wordBreak: 'break-word' }}
                                  >
                                    {message.body}
                                  </div>
                                  {message.edited && (
                                    <span className="text-xs text-gray-400 px-2">
                                      Edited {new Date(message.updated_at).toLocaleString()}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <MessageInput onSend={handleSendMessage} disabled={sending} initialText={prefillText} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <p className="text-gray-600">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (initialText && initialText !== text) {
      setText(initialText)
    }
  }, [initialText])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(e, text)
    setText('')
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, show a message that image sharing is coming soon
    // TODO: Implement actual image upload functionality
    alert('Image sharing is coming soon!')

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 border-t border-gray-200 bg-white"
    >
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none text-black"
          disabled={disabled}
          aria-label="Message input"
        />

        {/* Image upload button */}
        <button
          type="button"
          onClick={handleImageClick}
          className="p-2 text-gray-600 hover:text-black rounded-full hover:bg-gray-100 flex-shrink-0"
          aria-label="Add image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          aria-label="Upload image"
        />

        {/* Send button - always visible */}
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className={`p-2 rounded-full flex-shrink-0 transition-colors ${
            text.trim() && !disabled
              ? 'text-ume-indigo hover:bg-indigo-50'
              : 'text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Send message"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-ume-bg items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}
