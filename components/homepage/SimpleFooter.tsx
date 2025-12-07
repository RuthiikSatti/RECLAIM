/**
 * SimpleFooter Component
 *
 * Minimal footer with links and copyright.
 * Keeps it clean and minimal as shown in screenshots.
 */

import Link from 'next/link'

export default function SimpleFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer Links */}
        <nav className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-6" aria-label="Footer navigation">
          <Link
            href="/about"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:underline"
          >
            About
          </Link>
          <Link
            href="/marketplace"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:underline"
          >
            Marketplace
          </Link>
          <Link
            href="/contact"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:underline"
          >
            Contact
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:underline"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:underline"
          >
            Terms
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-center text-xs text-gray-500">
          © {currentYear} RECLAIM. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
