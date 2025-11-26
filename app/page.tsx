import Link from 'next/link'
import { getUser } from '@/lib/auth/actions'

export default async function Home() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Navigation */}
      <nav className="bg-white">
        <div className="px-12 py-6">
          <div className="flex items-center justify-between">
            {/* Left - Logo */}
            <div className="flex items-center gap-3">
              <span className="text-[28px] font-black tracking-[-0.02em] text-black">RECLAIM</span>
              <span className="text-[11px] font-light tracking-[0.15em] uppercase text-black">MARKETPLACE</span>
            </div>

            {/* Right - Icons */}
            <div className="flex items-center gap-8">
              <Link href="/marketplace" className="text-black hover:opacity-60 transition-opacity" aria-label="Search">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </Link>
              {user && (
                <Link href="/create" className="text-black hover:opacity-60 transition-opacity" aria-label="Create listing">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </Link>
              )}
              {user && (
                <Link href="/messages" className="text-black hover:opacity-60 transition-opacity" aria-label="Messages">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m2 7 8.5 5.5a2 2 0 0 0 2 0L22 7"/>
                  </svg>
                </Link>
              )}
              <Link href={user ? `/profile/${user.id}` : "/login"} className="text-black hover:opacity-60 transition-opacity" aria-label="Profile">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="5"/>
                  <path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
              </Link>
              <Link href="/marketplace" className="text-black hover:opacity-60 transition-opacity" aria-label="Cart">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-[#f5f5f5]">
        <div className="px-12 pt-32 pb-40 min-h-[calc(100vh-88px)] flex flex-col items-center justify-center">
          <div className="text-center max-w-5xl">
            <p className="text-[13px] font-normal tracking-[0.05em] text-black mb-16">For students, by students</p>

            <h1 className="text-[100px] leading-[0.85] font-black tracking-[-0.03em] text-black mb-20" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              YOUR UNIVERSITY<br />MARKETPLACE
            </h1>

            <Link
              href="/marketplace"
              className="inline-block bg-black text-white px-20 py-5 text-[14px] font-medium tracking-[0.02em] hover:bg-gray-900 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Cart Icon */}
      <Link
        href="/marketplace"
        className="fixed bottom-10 right-10 bg-black text-white w-16 h-16 flex items-center justify-center hover:bg-gray-900 transition-colors shadow-lg"
        aria-label="View cart"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      </Link>
    </div>
  )
}
