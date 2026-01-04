/**
 * CategoryGrid Component
 *
 * Category grid with Phosphor icons and labels.
 * Matches screenshot 3: "CATEGORIES" heading with "ALL" button and icon grid below.
 * Features:
 * - 7 categories in a horizontal row (responsive wrapping)
 * - Phosphor icon + label for each category
 * - Links to marketplace with category filter
 * - Accessible keyboard navigation
 */

'use client'

import Link from 'next/link'
import CategoryIcon from '@/components/marketplace/CategoryIcon'

interface Category {
  id: string
  name: string
  categoryKey: string // Key for CategoryIcon component
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
    <section className="w-full py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <h2 className="heading-primary text-black mb-8 sm:mb-12">
          CATEGORIES
        </h2>

        {/* ALL Button */}
        <div className="flex justify-center mb-12 sm:mb-16">
          <Link
            href="/marketplace"
            className="inline-block px-12 py-3 border-2 border-black text-black font-medium text-sm tracking-[-0.03em] uppercase rounded-full hover:bg-black hover:text-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-black/30"
          >
            ALL
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 sm:gap-12">
          {categories.map((category) => {
            return (
              <Link
                key={category.id}
                href={category.href}
                className="flex flex-col items-center group focus:outline-none focus:ring-4 focus:ring-black/30 rounded-lg p-4 -m-4"
              >
                {/* Phosphor Icon */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-4 text-black group-hover:scale-110 transition-transform duration-200">
                  <CategoryIcon category={category.categoryKey} size={64} className="text-black" />
                </div>

                {/* Label */}
                <span className="text-xs sm:text-sm font-medium text-black text-center group-hover:underline">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
