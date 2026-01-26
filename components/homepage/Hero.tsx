/**
 * Hero Component
 *
 * Split-layout hero section matching the UME design:
 * - Left side: Dark indigo background with headline and CTA
 * - Right side: Full-height image of students
 */

import Link from 'next/link'
import Image from 'next/image'

interface HeroProps {
  /** Background image URL for right side */
  backgroundImage?: string
  /** Subtitle text */
  subtitle?: string
  /** CTA button text */
  ctaText?: string
  /** CTA button destination */
  ctaHref?: string
}

export default function Hero({
  backgroundImage = '/placeholders/hero-city.jpg',
  subtitle = 'For students, by students',
  ctaText = 'Browse Marketplace',
  ctaHref = '/marketplace'
}: HeroProps) {
  return (
    <section className="relative w-full h-[calc(100vh-80px)] min-h-[500px] flex">
      {/* Left Side - Dark Indigo Background with Text (transparent on mobile to show image) */}
      <div className="w-full md:w-[40%] lg:w-[35%] bg-transparent md:bg-ume-indigo flex flex-col justify-center px-8 md:px-12 lg:px-16 py-12 relative z-10">
        {/* Headline */}
        <h1 className="text-left mb-2">
          <span className="block text-white font-black text-5xl sm:text-6xl md:text-4xl lg:text-5xl uppercase tracking-tight leading-tight">
            YOUR UNIVERSITY
          </span>
          <span className="block text-ume-indigo md:text-ume-pink font-black text-5xl sm:text-6xl md:text-4xl lg:text-5xl uppercase tracking-tight leading-tight">
            MARKETPLACE
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-white md:text-white/80 text-sm md:text-base font-bold md:font-light mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] md:drop-shadow-none">
          {subtitle}
        </p>

        {/* CTA Button - Indigo/white on mobile, Cream/indigo on desktop */}
        <Link
          href={ctaHref}
          className="inline-block w-fit px-8 py-3 bg-ume-indigo md:bg-ume-cream text-white md:text-ume-indigo font-semibold text-sm rounded-full hover:bg-ume-indigo/90 md:hover:bg-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-ume-indigo/30 md:focus:ring-white/30 shadow-lg"
        >
          {ctaText}
        </Link>
      </div>

      {/* Right Side - Image */}
      <div className="hidden md:block md:w-[60%] lg:w-[65%] relative">
        <Image
          src={backgroundImage}
          alt="Students collaborating"
          fill
          className="object-cover object-center"
          priority
          quality={90}
          sizes="(min-width: 1024px) 65vw, 60vw"
        />
      </div>

      {/* Mobile: Background image fills entire panel */}
      <div className="absolute inset-0 z-0 md:hidden">
        <Image
          src={backgroundImage}
          alt="Students collaborating"
          fill
          className="object-cover object-center"
          priority
          quality={90}
          sizes="100vw"
        />
      </div>
    </section>
  )
}
