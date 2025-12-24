'use client'

/**
 * HeaderSearch Component
 *
 * Full-width header search bar that appears when search icon is clicked
 * Features:
 * - Fixed position at top of viewport
 * - Brand on left, full-width search input in center, icons on right
 * - Auto-focus on input when opened
 * - ESC key to close
 * - Click outside to close
 * - Enter to submit and route to /marketplace?search=...
 * - Minimal design matching existing header
 */

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function HeaderSearch({
  open,
  value,
  onChange,
  onClose,
  onSubmit,
  userId,
  unreadMessages,
  cartItemCount,
}: {
  open: boolean
  value: string
  onChange: (v: string) => void
  onClose: () => void
  onSubmit: () => void
  userId?: string
  unreadMessages: number
  cartItemCount: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus when opened
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (open && !target.closest('.header-search-container')) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-white border-b border-gray-200 header-search-container">
      <div className="max-w-[1400px] mx-auto px-12 h-20 flex items-center gap-8">
        {/* Brand */}
        <Link href="/marketplace" className="flex items-center gap-2 flex-shrink-0">
          <span className="font-black text-xl" style={{ fontFamily: 'Archivo Black, sans-serif' }}>
            RECLAIM
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">marketplace</span>
        </Link>

        {/* Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="flex-1 max-w-2xl"
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search listings..."
            className="w-full h-12 rounded-full border border-gray-300 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </form>

        {/* Right Side Icons */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* ESC hint */}
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close search"
          >
            ESC
          </button>

          {/* Create Listing */}
          <Link
            href="/create"
            className="relative"
            aria-label="Create listing"
          >
            <svg
              className="w-[18px] h-[18px] text-black"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Link>

          {/* Messages */}
          <Link
            href="/messages"
            className="relative"
            aria-label="Messages"
          >
            <svg
              className="w-[18px] h-[18px] text-black"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
            {unreadMessages > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </Link>

          {/* Profile */}
          <Link
            href={userId ? `/profile/${userId}` : '/profile'}
            className="relative"
            aria-label="Profile"
          >
            <svg
              className="w-[18px] h-[18px] text-black"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative"
            aria-label="Shopping cart"
          >
            <svg
              className="w-[18px] h-[18px] text-black"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
