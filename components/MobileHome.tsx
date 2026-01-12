/*
 * MOBILE-ONLY HOMEPAGE — md:hidden — DO NOT CHANGE DESKTOP
 *
 * Mobile-optimized version of desktop homepage with:
 * - All desktop sections (Hero, Feature Slider, Categories, Newsletter)
 * - Black text, same styling as desktop
 * - Horizontal scrolling categories
 * - Header/Footer handled by layout (MobileHeaderWrapper + MobileFooter)
 */

import Hero from '@/components/homepage/Hero'
import FeatureSlider from '@/components/homepage/FeatureSlider'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import NewsletterSignup from '@/components/homepage/NewsletterSignup'

export default function MobileHome() {
  return (
    <div className="bg-white min-h-screen">
      {/* MAIN CONTENT - Same as desktop */}
      <main className="min-h-screen">
        {/* Hero Section */}
        <Hero
          backgroundImage="/placeholders/hero-city.jpg"
          subtitle="For students, by students"
          headline="YOUR UNIVERSITY MARKETPLACE"
          ctaText="Browse Marketplace"
          ctaHref="/marketplace"
        />

        {/* Feature Slider - Real-time chat, Verified students, Safe & simple */}
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
          autoPlayInterval={3000}
        />

        {/* Category Grid - Browse by category */}
        <CategoryGrid />

        {/* Newsletter Signup */}
        <NewsletterSignup />
      </main>
    </div>
  )
}
