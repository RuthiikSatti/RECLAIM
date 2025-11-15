/**
 * MessageBubble Component
 *
 * Displays a single message with:
 * - Delivery/seen indicators (single check = delivered, double check = seen)
 * - Long-press (mobile) and right-click (desktop) context menu
 * - Edit and delete options with confirmation
 * - Inline editing mode
 * - Accessibility features (keyboard navigation, ARIA labels)
 *
 * Usage:
 * <MessageBubble
 *   message={message}
 *   isOwnMessage={message.sender_id === currentUserId}
 *   onEdit={(id, body) => handleEdit(id, body)}
 *   onDelete={(id) => handleDelete(id)}
 * />
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Message } from '@/lib/hooks/useMessages'

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  onEdit?: (messageId: string, newBody: string) => Promise<boolean>
  onDelete?: (messageId: string) => Promise<boolean>
  editTimeLimit?: number // in milliseconds, default 2 minutes
}

export default function MessageBubble({
  message,
  isOwnMessage,
  onEdit,
  onDelete,
  editTimeLimit = 2 * 60 * 1000 // 2 minutes
}: MessageBubbleProps) {
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(message.body)
  const [isDeleting, setIsDeleting] = useState(false)

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Check if message is within edit time limit
  const canEdit = () => {
    if (!isOwnMessage || !onEdit) return false

    const messageAge = Date.now() - new Date(message.created_at).getTime()
    return messageAge <= editTimeLimit
  }

  const canDelete = () => isOwnMessage && onDelete

  // Handle long press for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isOwnMessage) return

    longPressTimerRef.current = setTimeout(() => {
      const touch = e.touches[0]
      openContextMenu(touch.clientX, touch.clientY)
    }, 500) // 500ms long press
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Handle right-click for desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isOwnMessage) return

    e.preventDefault()
    openContextMenu(e.clientX, e.clientY)
  }

  // Open context menu at position
  const openContextMenu = (x: number, y: number) => {
    setContextMenuPosition({ x, y })
    setShowContextMenu(true)
  }

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false)
  }, [])

  // Handle edit
  const handleEditClick = () => {
    if (!canEdit()) return

    setIsEditing(true)
    setEditedText(message.body)
    closeContextMenu()
  }

  // Save edit
  const handleSaveEdit = async () => {
    if (!editedText.trim() || !onEdit) return

    const success = await onEdit(message.id, editedText)
    if (success) {
      setIsEditing(false)
    }
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedText(message.body)
  }

  // Handle delete with confirmation
  const handleDeleteClick = async () => {
    closeContextMenu()

    if (!confirm('Are you sure you want to delete this message?')) {
      return
    }

    if (!onDelete) return

    setIsDeleting(true)
    const success = await onDelete(message.id)

    if (!success) {
      setIsDeleting(false)
    }
    // If successful, message will be removed from list by parent
  }

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node) &&
        bubbleRef.current &&
        !bubbleRef.current.contains(e.target as Node)
      ) {
        closeContextMenu()
      }
    }

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showContextMenu, closeContextMenu])

  // Keyboard support for context menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isEditing) {
        handleCancelEdit()
      } else if (showContextMenu) {
        closeContextMenu()
      }
    } else if (e.key === 'Enter' && isEditing && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    }
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Render delivery/seen indicators
  const renderStatusIndicator = () => {
    if (!isOwnMessage) return null

    // Optimistic/sending state
    if (message.optimistic || !message.delivered_at) {
      return (
        <span className="text-xs opacity-50 ml-1" title="Sending...">
          <svg className="w-3 h-3 inline animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      )
    }

    // Delivered but not seen - single check
    if (message.delivered_at && !message.seen_at) {
      return (
        <span className="text-xs opacity-70 ml-1" title={`Delivered at ${formatTime(message.delivered_at)}`}>
          ✓
        </span>
      )
    }

    // Seen - double check
    if (message.seen_at) {
      return (
        <span className="text-xs opacity-90 ml-1" title={`Seen at ${formatTime(message.seen_at)}`}>
          ✓✓
        </span>
      )
    }

    return null
  }

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isDeleting ? 'opacity-50' : ''}`}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={bubbleRef}
        className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
          isOwnMessage
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-black'
        } ${isOwnMessage ? 'cursor-context-menu' : ''}`}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="article"
        aria-label={`Message from ${isOwnMessage ? 'you' : 'other user'}`}
      >
        {isEditing ? (
          // Edit mode
          <div className="space-y-2">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              autoFocus
              aria-label="Edit message"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Cancel editing"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Save changes"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          // Display mode
          <>
            <p className="text-sm break-words">
              {message.body}
              {message.edited && (
                <span className="text-xs opacity-70 ml-1" title="Edited">
                  (edited)
                </span>
              )}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p
                className={`text-xs ${
                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {formatTime(message.created_at)}
              </p>
              {renderStatusIndicator()}
            </div>
          </>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]"
          style={{
            top: `${contextMenuPosition.y}px`,
            left: `${contextMenuPosition.x}px`
          }}
          role="menu"
          aria-label="Message actions"
        >
          {canEdit() && (
            <button
              onClick={handleEditClick}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              role="menuitem"
              tabIndex={0}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          {canDelete() && (
            <button
              onClick={handleDeleteClick}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
              role="menuitem"
              tabIndex={0}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
