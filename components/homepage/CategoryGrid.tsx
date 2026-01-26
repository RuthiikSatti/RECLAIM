/**
 * CategoryGrid Component
 *
 * Minimalistic category section:
 * - Dark indigo background
 * - "CATEGORIES" title in pastel pink
 * - "ALL" pill button in cream with pink text
 * - Clean white card without border containing category icons
 */

'use client'

import Link from 'next/link'
import CategoryIcon from '@/components/marketplace/CategoryIcon'

interface Category {
  id: string
  name: string
  categoryKey: string
  href: string
}

const categories: Category[] = [
  {
    id: 'dorm',
    name: 'Dorm & Decor',
    categoryKey: 'Dorm & Decor',
    href: '/marketplace?category=dorm-and-decor'
  },
  {
    id: 'craft',
    name: 'Fun & Craft',
    categoryKey: 'Fun & Craft',
    href: '/marketplace?category=fun-and-craft'
  },
  {
    id: 'transport',
    name: 'Transportation',
    categoryKey: 'Transportation',
    href: '/marketplace?category=transportation'
  },
  {
    id: 'tech',
    name: 'Tech & Gadgets',
    categoryKey: 'Tech & Gadgets',
    href: '/marketplace?category=tech-and-gadgets'
  },
  {
    id: 'clothing',
    name: 'Clothing & Accessories',
    categoryKey: 'Clothing & Accessories',
    href: '/marketplace?category=clothing-and-accessories'
  },
  {
    id: 'giveaways',
    name: 'Giveaways',
    categoryKey: 'Giveaways',
    href: '/marketplace?category=giveaways'
  },
  {
    id: 'other',
    name: 'Other',
    categoryKey: 'Other',
    href: '/marketplace?category=other'
  }
]

export default function CategoryGrid() {
  return (
    <section className="w-full bg-ume-bg py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading - Dark Indigo text */}
        <h2 className="font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase text-center tracking-tight text-ume-indigo mb-4 sm:mb-6">
          CATEGORIES
        </h2>

        {/* ALL Button - Pink background with white text */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <Link
            href="/marketplace"
            className="inline-block px-12 py-3 bg-ume-pink text-white font-semibold text-sm tracking-wide uppercase rounded-full hover:bg-pink-400 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-ume-pink/30 shadow-md"
          >
            ALL
          </Link>
        </div>

        {/* White Card containing categories */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm">
          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 justify-start">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className="flex flex-col items-center group focus:outline-none rounded-lg p-2 flex-shrink-0"
                  style={{ width: '72px' }}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 flex items-center justify-center mb-2 text-ume-indigo group-hover:text-ume-pink group-hover:scale-110 transition-all duration-200">
                    <CategoryIcon category={category.categoryKey} size={40} />
                  </div>
                  {/* Label */}
                  <span className="text-[10px] font-medium text-ume-indigo text-center group-hover:text-ume-pink whitespace-nowrap transition-colors duration-200">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-7 md:gap-6 lg:gap-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="flex flex-col items-center group focus:outline-none rounded-lg p-4"
              >
                {/* Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-3 text-ume-indigo group-hover:text-ume-pink group-hover:scale-110 transition-all duration-200">
                  <CategoryIcon category={category.categoryKey} size={56} />
                </div>
                {/* Label */}
                <span className="text-xs sm:text-sm font-medium text-ume-indigo text-center group-hover:text-ume-pink transition-colors duration-200">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Hide scrollbar for cleaner look */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}
