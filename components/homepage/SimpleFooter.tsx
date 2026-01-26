/**
 * SimpleFooter Component
 *
 * Minimal footer matching the UME design:
 * - Dark indigo background
 * - Footer links (About Us, Contact, Privacy, Terms)
 * - Copyright text
 */

import Link from 'next/link'

export default function SimpleFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="hidden md:block w-full bg-ume-indigo py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer Links */}
        <nav className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-6" aria-label="Footer navigation">
          <Link
            href="/about"
            className="text-sm text-white hover:text-ume-pink transition-colors focus:outline-none focus:underline"
          >
            About us
          </Link>
          <Link
            href="/contact"
            className="text-sm text-white hover:text-ume-pink transition-colors focus:outline-none focus:underline"
          >
            Contact
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-white hover:text-ume-pink transition-colors focus:outline-none focus:underline"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-white hover:text-ume-pink transition-colors focus:outline-none focus:underline"
          >
            Terms
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-center text-xs text-white/70">
          @{currentYear} UME all rights reserved
        </p>
      </div>
    </footer>
  )
}
