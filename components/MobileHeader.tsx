'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HeaderInlineSearch from './search/HeaderInlineSearch'

interface MobileHeaderProps {
  unreadMessages?: number
  cartItemCount?: number
  userAvatar?: string
  userId?: string
}

export default function MobileHeader({
  unreadMessages = 0,
  cartItemCount = 0,
  userAvatar,
  userId
}: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      {/* MOBILE COMPACT HEADER - Only visible on mobile */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-3 py-2.5">
          {/* Top Row: Logo + Icons */}
          <div className="flex items-center justify-between">
            {/* Logo - UME with U and E in indigo, M in pink */}
            <Link
              href="/"
              className="flex items-baseline"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              <span className="text-lg font-black tracking-[-0.03em] text-ume-indigo">U</span>
              <span className="text-lg font-black tracking-[-0.03em] text-ume-pink">M</span>
              <span className="text-lg font-black tracking-[-0.03em] text-ume-pink">E</span>
            </Link>

            {/* Icons */}
            <div className="flex items-center gap-2.5">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="p-1"
              >
                <svg className="w-4 h-4 text-ume-indigo" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>

              {/* Cart with Badge */}
              <button
                onClick={() => router.push('/cart')}
                aria-label="Cart"
                className="p-1 relative"
              >
                <svg className="w-4 h-4 text-ume-indigo" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-ume-pink text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-1">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>

              {/* Three-line menu */}
              <button
                onClick={() => setIsMenuOpen(true)}
                aria-label="Menu"
                className="p-1"
              >
                <svg className="w-4 h-4 text-ume-indigo" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Row - Appears when search is open */}
          {searchOpen && (
            <div className="mt-2">
              <HeaderInlineSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {/* DRAWER MENU */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-56 bg-white z-50 shadow-xl md:hidden">
            <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-ume-indigo">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                <svg className="w-4 h-4 text-ume-indigo" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="p-3">
              <ul className="space-y-0.5">
                {/* Marketplace */}
                <li>
                  <Link
                    href="/marketplace"
                    className="flex items-center gap-2.5 p-2.5 text-xs text-ume-indigo hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <path d="M9 22V12h6v10"/>
                    </svg>
                    Marketplace
                  </Link>
                </li>

                {/* Messages - only show if logged in */}
                {userId && (
                  <li>
                    <Link
                      href="/messages"
                      className="flex items-center gap-2.5 p-2.5 text-xs text-ume-indigo hover:bg-gray-100 rounded-lg relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="m2 7 8.5 5.5a2 2 0 0 0 2 0L22 7"/>
                      </svg>
                      Messages
                      {unreadMessages > 0 && (
                        <span className="ml-auto bg-ume-pink text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-1">
                          {unreadMessages > 99 ? '99+' : unreadMessages}
                        </span>
                      )}
                    </Link>
                  </li>
                )}

                {/* Create - only show if logged in */}
                {userId && (
                  <li>
                    <Link
                      href="/create"
                      className="flex items-center gap-2.5 p-2.5 text-xs text-ume-indigo hover:bg-gray-100 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Create
                    </Link>
                  </li>
                )}

                {/* Profile */}
                <li>
                  <Link
                    href={userId ? `/profile/${userId}` : "/login"}
                    className="flex items-center gap-2.5 p-2.5 text-xs text-ume-indigo hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="5"/>
                        <path d="M20 21a8 8 0 1 0-16 0"/>
                      </svg>
                    )}
                    {userId ? 'Profile' : 'Log in'}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}
    </>
  )
}
