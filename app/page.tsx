/**
 * Homepage
 *
 * Main landing page for UME marketplace.
 * Features:
 * - Mobile-only homepage (MobileHome component - hidden on desktop)
 * - Desktop: Split hero section with dark indigo left, image right
 * - Owl-style feature carousel with 3 cards
 * - Category grid with dark indigo background
 * - Newsletter signup
 * - Footer (in layout.tsx)
 *
 * TESTING MOBILE LAYOUT ON DESKTOP:
 * Add ?showMobile=1 to URL to force mobile layout on desktop browsers
 * Example: http://localhost:3000/?showMobile=1
 */

import Hero from '@/components/homepage/Hero'
import FeatureSlider from '@/components/homepage/FeatureSlider'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import MobileHome from '@/components/MobileHome'
import Link from 'next/link'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ showMobile?: string }>
}) {
  // DEBUG ONLY: Allow viewing mobile layout on desktop via ?showMobile=1
  // Remove this in production or keep for QA testing
  const params = await searchParams
  const debugForceMobile = params.showMobile === '1'
  return (
    <>
      {/* MOBILE-ONLY HOMEPAGE - Only visible on mobile devices (or with ?showMobile=1) */}
      <div className={debugForceMobile ? '' : 'md:hidden'}>
        <MobileHome />
      </div>

      {/* DESKTOP HOMEPAGE - Hidden on mobile */}
      <main className={`min-h-screen bg-ume-bg ${debugForceMobile ? 'hidden' : 'hidden md:block'}`}>
        {/* Hero Section - Split layout with dark indigo left, image right */}
        <Hero
          backgroundImage="/placeholders/hero-main.png"
          subtitle="For students, by students"
          ctaText="Browse Marketplace"
          ctaHref="/marketplace"
        />

        {/* Feature Slider - Owl carousel style with 3 cards */}
        <FeatureSlider
          slides={[
            {
              id: '1',
              headline: 'REAL-TIME CHAT',
              subtitle: 'Message sellers instantly and arrange pickups easily'
            },
            {
              id: '2',
              headline: 'VERIFIED STUDENTS ONLY',
              subtitle: '.edu email verification ensures you\'re trading within your campus community'
            },
            {
              id: '3',
              headline: 'SAFE & SIMPLE',
              subtitle: 'Report inappropriate listings and trade with confidence'
            }
          ]}
          autoPlayInterval={4000}
        />

        {/* Category Grid - Browse by category */}
        <CategoryGrid />

        {/* Sign Up Call to Action */}
        <section className="w-full py-12 sm:py-16 bg-ume-bg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-ume-indigo mb-6">
              JOIN UME TODAY
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Start buying and selling with verified students on your campus
            </p>
            <Link
              href="/signup"
              className="inline-block px-12 py-4 bg-ume-pink text-white font-semibold text-base rounded-full hover:bg-pink-400 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-ume-pink/50 shadow-lg"
            >
              Sign Up Now
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
