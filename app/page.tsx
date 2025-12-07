/**
 * Homepage
 *
 * Main landing page for RECLAIM marketplace.
 * Features:
 * - Hero section with background image and CTA
 * - Feature slider showcasing key features
 * - Category grid for easy navigation
 * - Newsletter signup
 * - Footer
 */

import Hero from '@/components/homepage/Hero'
import FeatureSlider from '@/components/homepage/FeatureSlider'
import CategoryGrid from '@/components/homepage/CategoryGrid'
import NewsletterSignup from '@/components/homepage/NewsletterSignup'

export default async function Home() {
  return (
    <main className="min-h-screen bg-white">
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
            subtitle: '.edu verification ensures you are trading within your campus community',
            alt: 'Verified students only feature'
          },
          {
            id: '3',
            image: '/placeholders/feature-safe.jpg',
            headline: 'SAFE and SIMPLE',
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
  )
}
