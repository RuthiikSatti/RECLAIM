/**
 * CategoryGrid Component
 *
 * Category grid with icons and labels.
 * Matches screenshot 3: "CATEGORIES" heading with "ALL" button and icon grid below.
 * Features:
 * - 7 categories in a horizontal row (responsive wrapping)
 * - Icon + label for each category
 * - Links to marketplace with category filter
 * - Accessible keyboard navigation
 */

import Link from 'next/link'
import {
  DormIcon,
  CraftIcon,
  TransportationIcon,
  TechIcon,
  ClothingIcon,
  GiftIcon,
  GridIcon
} from './CategoryIcons'

interface Category {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const categories: Category[] = [
  {
    id: 'dorm',
    name: 'Dorm and Decor',
    icon: DormIcon,
    href: '/marketplace?category=Dorm and Decor'
  },
  {
    id: 'craft',
    name: 'Fun and Craft',
    icon: CraftIcon,
    href: '/marketplace?category=Fun and Craft'
  },
  {
    id: 'transport',
    name: 'Transportation',
    icon: TransportationIcon,
    href: '/marketplace?category=Transportation'
  },
  {
    id: 'tech',
    name: 'Tech and Gadgets',
    icon: TechIcon,
    href: '/marketplace?category=Tech and Gadgets'
  },
  {
    id: 'clothing',
    name: 'Clothing & Accessories',
    icon: ClothingIcon,
    href: '/marketplace?category=Clothing and Accessories'
  },
  {
    id: 'giveaways',
    name: 'Giveaways',
    icon: GiftIcon,
    href: '/marketplace?category=Giveaways'
  },
  {
    id: 'other',
    name: 'Other',
    icon: GridIcon,
    href: '/marketplace?category=Other'
  }
]

export default function CategoryGrid() {
  return (
    <section className="w-full py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black tracking-[0.2em] text-center text-gray-900 mb-8 sm:mb-12" style={{ fontFamily: '"Marianina FY", system-ui, -apple-system, sans-serif' }}>
          CATEGORIES
        </h2>

        {/* ALL Button */}
        <div className="flex justify-center mb-12 sm:mb-16">
          <Link
            href="/marketplace"
            className="inline-block px-12 py-3 border-2 border-gray-900 text-gray-900 font-medium text-sm tracking-[0.15em] uppercase rounded-full hover:bg-gray-900 hover:text-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-900/30"
          >
            ALL
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 sm:gap-12">
          {categories.map((category) => {
            const Icon = category.icon

            return (
              <Link
                key={category.id}
                href={category.href}
                className="flex flex-col items-center group focus:outline-none focus:ring-4 focus:ring-gray-900/30 rounded-lg p-4 -m-4"
              >
                {/* Icon */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-4 text-gray-900 group-hover:scale-110 transition-transform duration-200">
                  <Icon className="w-full h-full" />
                </div>

                {/* Label */}
                <span className="text-xs sm:text-sm font-medium text-gray-900 text-center group-hover:underline">
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
