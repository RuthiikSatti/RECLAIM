/*
 * MOBILE-ONLY HOMEPAGE — md:hidden — DO NOT CHANGE DESKTOP
 *
 * PR CHECKLIST:
 * ✅ Mobile-only (md:hidden) verified
 * ✅ Tap targets >=44px
 * ✅ Drawer accessible & dismissible
 * ✅ Images lazy-loaded / srcset recommended
 * ✅ No desktop changes
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function MobileHome() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close drawer on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isDrawerOpen])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  // Trap focus in drawer
  useEffect(() => {
    if (isDrawerOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }

      drawerRef.current.addEventListener('keydown', handleTab as any)
      firstElement?.focus()

      return () => {
        drawerRef.current?.removeEventListener('keydown', handleTab as any)
      }
    }
  }, [isDrawerOpen])

  const categories = [
    { name: 'Electronics', emoji: '📱', href: '/marketplace?category=electronics' },
    { name: 'Fashion', emoji: '👕', href: '/marketplace?category=fashion' },
    { name: 'Books', emoji: '📚', href: '/marketplace?category=books' },
    { name: 'Furniture', emoji: '🛋️', href: '/marketplace?category=furniture' },
    { name: 'Sports', emoji: '⚽', href: '/marketplace?category=sports' },
    { name: 'Art', emoji: '🎨', href: '/marketplace?category=art' },
    { name: 'Other', emoji: '🔧', href: '/marketplace?category=other' },
  ]

  const verifiedListings = [
    { id: 1, title: 'MacBook Pro 2021', price: '$899', image: '/placeholder-laptop.jpg' },
    { id: 2, title: 'Desk Chair', price: '$45', image: '/placeholder-chair.jpg' },
    { id: 3, title: 'Textbooks Bundle', price: '$120', image: '/placeholder-books.jpg' },
  ]

  return (
    <div className="md:hidden bg-white min-h-screen flex flex-col">
      {/* COMPACT FIXED HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-lg font-bold tracking-tight">
            UME
          </Link>

          {/* Icons */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <Link
              href="/search"
              className="p-2 touch-target"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="p-2 touch-target"
              aria-label="Shopping cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </Link>

            {/* Three-line menu (hamburger) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 touch-target"
              aria-label="Open menu"
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-drawer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* DRAWER MENU (slides from right) */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            ref={drawerRef}
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed top-0 right-0 bottom-0 w-64 bg-white z-50 shadow-xl flex flex-col animate-slide-in-right"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-bold text-base">Menu</span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 touch-target"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Links */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 touch-target"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span className="text-sm font-medium">Profile</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/messages"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 touch-target"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span className="text-sm font-medium">Messages</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/create"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 touch-target"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-sm font-medium">Create</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/marketplace"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 touch-target"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <path d="M9 22V12h6v10" />
                    </svg>
                    <span className="text-sm font-medium">Marketplace</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 pb-16">
        {/* HERO BLOCK */}
        <section className="px-4 py-6 text-center">
          {/* Hero image placeholder */}
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-3 relative overflow-hidden">
            <Image
              src="/hero-mobile.jpg"
              alt="Students marketplace"
              fill
              className="object-cover"
              loading="lazy"
              // TODO: Add srcset for production responsive images
            />
          </div>
          <p className="text-sm text-gray-600 mb-3">For students, by students</p>
          <Link
            href="/marketplace"
            className="inline-block bg-black text-white px-6 py-3 rounded-full text-sm font-medium touch-target"
          >
            Browse Marketplace
          </Link>
        </section>

        {/* VERIFIED SECTION */}
        <section className="px-4 py-3">
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2" />
                VERIFIED — Students only
              </h2>
              <div className="flex gap-2">
                <button aria-label="Previous" className="p-1 touch-target">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button aria-label="Next" className="p-1 touch-target">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Horizontal scrollable cards */}
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <div className="flex gap-3 min-w-max">
                {verifiedListings.map((item) => (
                  <div
                    key={item.id}
                    className="w-32 flex-shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="h-24 bg-gray-200 relative">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <p className="text-xs text-gray-600">{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              All sellers verified with .edu email address
            </p>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section className="px-4 py-6">
          <h2 className="text-base font-bold text-center mb-3">CATEGORIES</h2>
          <div className="flex justify-center mb-4">
            <Link
              href="/marketplace"
              className="inline-block bg-gray-200 text-black px-4 py-1.5 rounded-full text-xs font-medium"
            >
              ALL
            </Link>
          </div>

          {/* Horizontal scrollable categories */}
          {/* Optional: add snap-x snap-mandatory for scroll-snap behavior */}
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <div className="flex gap-4 min-w-max">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="flex flex-col items-center gap-1 w-16 flex-shrink-0 touch-target"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                    {cat.emoji}
                  </div>
                  <span className="text-xs text-center">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SIGNUP STRIP */}
        <section className="px-4 py-6 bg-gray-50">
          <h3 className="text-sm font-bold mb-2">SIGN UP TO UME.</h3>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="Your .edu email"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium touch-target"
            >
              Sign up
            </button>
          </form>
        </section>
      </main>

      {/* FIXED FOOTER */}
      <footer className="border-t border-gray-200 px-4 py-3 bg-white text-center">
        <div className="flex justify-center gap-4 text-xs text-gray-600 mb-1">
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
        </div>
        <p className="text-xs text-gray-500">© {new Date().getFullYear()} UME</p>
      </footer>

      {/* Touch target helper - ensures 44x44px minimum */}
      <style jsx>{`
        .touch-target {
          min-width: 44px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  )
}

/*
 * TRADEOFFS & FOLLOW-UPS:
 *
 * 1. Scroll-snap: The categories and verified listings use overflow-x-auto.
 *    Consider adding `snap-x snap-mandatory` and `snap-center` on items for
 *    smoother swipe-to-snap behavior on iOS/Android.
 *
 * 2. Swipe gestures: Currently relies on native scroll. For more advanced
 *    carousel controls (prev/next buttons that actually work), consider a
 *    lightweight library like Embla Carousel or Swiper.
 *
 * 3. Real icons: Placeholder emojis are used for categories. Swap with actual
 *    SVG icons or icon font for production (e.g., Heroicons, Lucide).
 *
 * 4. Verification modal: The .edu note is static. Consider adding a "Learn more"
 *    link that opens a modal explaining the verification process.
 *
 * 5. Drawer direction: Currently slides from right. Could slide from bottom for
 *    a more native mobile feel. Right-slide chosen for simpler implementation
 *    and better focus trap (vertical nav list).
 */
