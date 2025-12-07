/**
 * Hero Component
 *
 * Full-width hero section with background image, centered headline, and CTA button.
 * Matches screenshot 1: city skyline background with "YOUR UNIVERSITY MARKETPLACE" headline.
 */

import Link from 'next/link'
import Image from 'next/image'

interface HeroProps {
  /** Background image URL - defaults to placeholder */
  backgroundImage?: string
  /** Subtitle text above headline */
  subtitle?: string
  /** Main headline text */
  headline?: string
  /** CTA button text */
  ctaText?: string
  /** CTA button destination */
  ctaHref?: string
}

export default function Hero({
  backgroundImage = '/placeholders/hero-city.jpg',
  subtitle = 'For students, by students',
  headline = 'YOUR UNIVERSITY\nMARKETPLACE',
  ctaText = 'Browse Marketplace',
  ctaHref = '/marketplace'
}: HeroProps) {
  return (
    <section className="relative w-full h-[calc(100vh-80px)] min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt="University marketplace background"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8">
        {/* Subtitle */}
        <p className="text-sm sm:text-base font-light tracking-wide text-gray-700 mb-4 sm:mb-6">
          {subtitle}
        </p>

        {/* Headline */}
        <h1 className="text-center font-black tracking-tight text-gray-900 mb-8 sm:mb-12 leading-[0.9] max-w-5xl" style={{ fontFamily: '"Marianina FY", system-ui, -apple-system, sans-serif' }}>
          <span className="block text-[clamp(3rem,8vw,7rem)]">
            YOUR UNIVERSITY
          </span>
          <span className="block text-[clamp(3rem,8vw,7rem)]">
            MARKETPLACE
          </span>
        </h1>

        {/* CTA Button - Pill shaped, dark background */}
        <Link
          href={ctaHref}
          className="inline-block px-12 py-4 sm:px-16 sm:py-5 bg-gray-900 text-white font-medium text-base sm:text-lg rounded-full hover:bg-gray-800 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-900/50 shadow-lg"
        >
          {ctaText}
        </Link>
      </div>

      {/* Bottom fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-[5]" />
    </section>
  )
}
