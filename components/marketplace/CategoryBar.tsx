'use client'

import { useRouter, useSearchParams } from 'next/navigation'

/**
 * CategoryBar Component
 *
 * Displays horizontal category chips that users can click to filter listings.
 * Features:
 * - Categories stay in their original position
 * - Updates URL with ?category=slug
 * - Centered layout with equal spacing
 * - Keyboard accessible with focus rings
 */

const CATEGORIES = [
  { slug: 'dorm-and-decor', display: 'Dorm & Decor' },
  { slug: 'fun-and-craft', display: 'Fun & Craft' },
  { slug: 'books', display: 'Books' },
  { slug: 'clothing-and-accessories', display: 'Clothing & Accessories' },
  { slug: 'transportation', display: 'Transportation' },
  { slug: 'tech-and-gadgets', display: 'Tech & Gadgets' },
  { slug: 'giveaways', display: 'Giveaways' },
  { slug: 'other', display: 'Other' },
]

interface CategoryBarProps {
  currentCategory?: string
}

export default function CategoryBar({ currentCategory }: CategoryBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())

    // Toggle category: if clicking active category, clear it
    if (currentCategory === slug) {
      params.delete('category')
    } else {
      params.set('category', slug)
    }

    // Navigate to new URL
    router.push(`/marketplace?${params.toString()}`)
  }

  const handleViewAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    router.push(`/marketplace?${params.toString()}`)
  }

  return (
    <div className="mb-6">
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {/* View All chip */}
          <button
            onClick={handleViewAll}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-ume-pink focus:ring-offset-2
              ${!currentCategory
                ? 'bg-ume-indigo text-white shadow-md'
                : 'bg-gray-200 text-ume-indigo hover:text-ume-pink hover:scale-105'
              }
            `}
            aria-pressed={!currentCategory}
            aria-label="View all categories"
          >
            All
          </button>

          {/* Category chips - always in original order */}
          {CATEGORIES.map((category) => {
            const isActive = currentCategory === category.slug

            return (
              <button
                key={category.slug}
                onClick={() => handleCategoryClick(category.slug)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-ume-pink focus:ring-offset-2
                  ${isActive
                    ? 'bg-ume-indigo text-white shadow-md'
                    : 'bg-gray-200 text-ume-indigo hover:text-ume-pink hover:scale-105'
                  }
                `}
                aria-pressed={isActive}
                aria-label={`Filter by ${category.display}`}
              >
                {category.display}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop: Centered flex-wrap layout */}
      <div className="hidden md:flex items-center justify-center gap-3 flex-wrap px-4">
        {/* View All chip */}
        <button
          onClick={handleViewAll}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-ume-pink focus:ring-offset-2
            ${!currentCategory
              ? 'bg-ume-indigo text-white shadow-md'
              : 'bg-gray-200 text-ume-indigo hover:text-ume-pink hover:scale-105'
            }
          `}
          aria-pressed={!currentCategory}
          aria-label="View all categories"
        >
          All
        </button>

        {/* Category chips - always in original order */}
        {CATEGORIES.map((category) => {
          const isActive = currentCategory === category.slug

          return (
            <button
              key={category.slug}
              onClick={() => handleCategoryClick(category.slug)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-ume-pink focus:ring-offset-2
                ${isActive
                  ? 'bg-ume-indigo text-white shadow-md'
                  : 'bg-gray-200 text-ume-indigo hover:text-ume-pink hover:scale-105'
                }
              `}
              aria-pressed={isActive}
              aria-label={`Filter by ${category.display}`}
            >
              {category.display}
            </button>
          )
        })}
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
    </div>
  )
}
