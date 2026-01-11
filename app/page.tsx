/**
 * Homepage
 *
 * Main landing page for UME marketplace.
 * Features:
 * - Mobile-only homepage (MobileHome component - hidden on desktop)
 * - Desktop: Hero section with background image and CTA
 * - Feature slider showcasing key features
 * - Category grid for easy navigation
 * - Newsletter signup
 * - Footer
 *
 * TESTING MOBILE LAYOUT ON DESKTOP:
 * Add ?showMobile=1 to URL to force mobile layout on desktop browsers
 * Example: http://localhost:3000/?showMobile=1
 */

import Hero from '@/components/homepage/Hero'
import FeatureSlider from '@/components/homepage/FeatureSlider'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import NewsletterSignup from '@/components/homepage/NewsletterSignup'
import MobileHome from '@/components/MobileHome'

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
      <main className={`min-h-screen bg-white ${debugForceMobile ? 'hidden' : 'hidden md:block'}`}>
        {/* Hero Section - Full screen with city skyline */}
        <Hero
          backgroundImage="/placeholders/hero-city.jpg"
          subtitle="For students, by students"
          headline="YOUR UNIVERSITY MARKETPLACE"
          ctaText="Browse Marketplace"
          ctaHref="/marketplace"
        />

      {/* Feature Slider - Showcase key features */}
      <FeatureSlider
        slides={[
          {
            id: '1',
            image: '/placeholders/feature-chat.jpg',
            headline: 'REAL-TIME CHAT',
            subtitle: 'Message sellers instantly and arrange pickups easily',
            alt: 'Real-time chat feature with ocean sunset background'
          },
          {
            id: '2',
            image: '/placeholders/feature-secure.jpg',
            headline: 'VERIFIED STUDENTS ONLY',
            subtitle: '.edu email verification ensures you\'re trading within your campus community',
            alt: 'Verified students only feature'
          },
          {
            id: '3',
            image: '/placeholders/feature-safe.jpg',
            headline: 'SAFE & SIMPLE',
            subtitle: 'Report inappropriate listings and trade with confidence',
            alt: 'Safe and simple trading feature'
          }
        ]}
        autoPlayInterval={5000}
      />

      {/* Category Grid - Browse by category */}
      <CategoryGrid />

        {/* Newsletter Signup */}
        <NewsletterSignup />
      </main>
    </>
  )
}
