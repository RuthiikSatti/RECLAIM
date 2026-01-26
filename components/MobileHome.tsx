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
    <div className="bg-ume-bg min-h-screen">
      {/* MAIN CONTENT - Same as desktop */}
      <main className="min-h-screen">
        {/* Hero Section - Split layout */}
        <Hero
          backgroundImage="/placeholders/hero-main.png"
          subtitle="For students, by students"
          ctaText="Browse Marketplace"
          ctaHref="/marketplace"
        />

        {/* Feature Slider - Owl carousel style */}
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

        {/* Newsletter Signup */}
        <NewsletterSignup />
      </main>
    </div>
  )
}
