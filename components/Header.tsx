'use client'

import Link from 'next/link'
import { useState } from 'react'
import HeaderInlineSearch from './search/HeaderInlineSearch'

interface HeaderProps {
  unreadMessages?: number
  cartItemCount?: number
  userAvatar?: string
  userId?: string
}

export default function Header({ unreadMessages = 0, cartItemCount = 0, userAvatar, userId }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
    <header className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 md:px-12 py-3 md:py-6">
        <div className="flex items-center justify-between">
          {/* Left - Logo + Subheading */}
          <div className="flex items-center gap-2">
            {/* UME Logo - U and E in indigo, M in pink */}
            <Link href="/" className="flex items-baseline hover:opacity-80 transition-opacity" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              <span className="text-[28px] font-black tracking-[-0.03em] text-ume-indigo">U</span>
              <span className="text-[28px] font-black tracking-[-0.03em] text-ume-pink">M</span>
              <span className="text-[28px] font-black tracking-[-0.03em] text-ume-pink">E</span>
            </Link>
            <span className="text-[11px] font-medium tracking-wide uppercase text-ume-indigo ml-1" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              UNIVERSITY MARKET<br />EXCHANGE
            </span>
          </div>

          {/* Center - Inline Search (when open) */}
          {searchOpen && (
            <div className="flex-1 max-w-2xl mx-8">
              <HeaderInlineSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            </div>
          )}

          {/* Right - Icons */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="text-ume-indigo hover:text-ume-pink transition-colors relative group"
              aria-label="Search"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-ume-indigo text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Search
              </span>
            </button>

            {/* Marketplace */}
            <Link
              href="/marketplace"
              className="text-ume-indigo hover:text-ume-pink transition-colors relative group"
              aria-label="Marketplace"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <path d="M9 22V12h6v10"/>
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-ume-indigo text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Marketplace
              </span>
            </Link>

            {/* Create Listing */}
            {userId && (
              <Link
                href="/create"
                className="text-ume-indigo hover:text-ume-pink transition-colors relative group"
                aria-label="Create listing"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-ume-indigo text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Create
                </span>
              </Link>
            )}

            {/* Messages with Badge */}
            {userId && (
              <Link
                href="/messages"
                className="text-ume-indigo hover:text-ume-pink transition-colors relative group"
                aria-label="Messages"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m2 7 8.5 5.5a2 2 0 0 0 2 0L22 7"/>
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-ume-pink text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-ume-indigo text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Messages
                </span>
              </Link>
            )}

            {/* Profile */}
            <Link
              href={userId ? `/profile/${userId}` : "/login"}
              className="text-ume-indigo hover:text-ume-pink transition-colors relative group"
              aria-label="Profile"
            >
              {userAvatar ? (
                <img src={userAvatar} alt="Profile" className="w-[18px] h-[18px] rounded-full object-cover" />
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="5"/>
                  <path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-ume-indigo text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {userId ? 'Profile' : 'Log in'}
              </span>
            </Link>

            {/* Cart with Badge */}
            <Link
              href="/cart"
              className="text-ume-indigo hover:text-ume-pink transition-colors relative group"
              aria-label="Cart"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-ume-pink text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-ume-indigo text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Cart
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
    </>
  )
}
