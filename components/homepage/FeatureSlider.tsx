'use client'

/**
 * FeatureSlider Component
 *
 * Full-width image slider with navigation arrows and auto-play.
 * Matches screenshot 2: large image with centered headline "REAL-TIME CHAT".
 * Features:
 * - Auto-play with 5s interval
 * - Pause on hover
 * - Left/right arrow navigation
 * - Keyboard accessible
 * - Touch swipe support on mobile
 */

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Slide {
  id: string
  image: string
  headline: string
  subtitle: string
  alt: string
}

interface FeatureSliderProps {
  slides?: Slide[]
  autoPlayInterval?: number
}

const defaultSlides: Slide[] = [
  {
    id: '1',
    image: '/placeholders/feature-chat.jpg',
    headline: 'REAL-TIME CHAT',
    subtitle: 'Message sellers instantly and arrange pickups easily',
    alt: 'Real-time chat feature'
  },
  {
    id: '2',
    image: '/placeholders/feature-secure.jpg',
    headline: 'VERIFIED STUDENTS ONLY',
    subtitle: 'Buy and sell safely within your verified university community',
    alt: 'Verified students only feature'
  },
  {
    id: '3',
    image: '/placeholders/feature-local.jpg',
    headline: 'SAFE & SIMPLE',
    subtitle: 'Easy-to-use platform designed for student safety and convenience',
    alt: 'Safe and simple feature'
  }
]

export default function FeatureSlider({
  slides = defaultSlides,
  autoPlayInterval = 3000
}: FeatureSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  // Auto-play
  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [isPaused, goToNext, autoPlayInterval, slides.length])

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      goToNext()
    }
    if (isRightSwipe) {
      goToPrevious()
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious()
    } else if (e.key === 'ArrowRight') {
      goToNext()
    }
  }

  if (slides.length === 0) return null

  return (
    <section
      className="relative w-full py-8 sm:py-12 bg-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Feature carousel"
    >
      {/* Container with padding/margin for spacing */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative h-[400px] sm:h-[500px] overflow-hidden rounded-2xl bg-gray-100">
          {/* All slides rendered, only current one visible */}
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                className="object-cover object-center"
                priority={index === 0}
                quality={90}
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-black/10" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6">
                <h2 className="heading-primary text-black mb-4">
                  {slide.headline}
                </h2>
                <p className="text-base sm:text-lg text-black font-light max-w-2xl text-center">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          ))}

          {/* Navigation Arrows - Invisible but clickable */}
          {slides.length > 1 && (
            <>
              {/* Left Arrow */}
              <button
                onClick={goToPrevious}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-transparent hover:bg-white/10 text-transparent hover:text-white flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="Previous slide"
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                onClick={goToNext}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-transparent hover:bg-white/10 text-transparent hover:text-white flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="Next slide"
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}

          {/* Slide Indicators */}
          {slides.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-white w-8'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
