'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import LocationRadiusSlider from './LocationRadiusSlider'

/**
 * FiltersRow Component
 *
 * Contains all filter controls:
 * - Condition dropdown
 * - Location Radius Slider
 * - Price Range button (placeholder for future)
 */

interface FiltersRowProps {
  currentCondition?: string
  currentRadius?: number
  userLat?: number
  userLng?: number
}

const CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished']

export default function FiltersRow({
  currentCondition,
  currentRadius,
  userLat,
  userLng
}: FiltersRowProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleConditionChange = (condition: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (condition === 'all') {
      params.delete('condition')
    } else {
      params.set('condition', condition)
    }

    router.push(`/marketplace?${params.toString()}`)
  }

  const handlePriceRange = () => {
    // Placeholder for future price range modal/dialog
    alert('Price range filter coming soon!')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
      {/* Condition Dropdown */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Condition
        </label>
        <select
          value={currentCondition || 'all'}
          onChange={(e) => handleConditionChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          aria-label="Filter by condition"
        >
          <option value="all">All Conditions</option>
          {CONDITIONS.map((condition) => (
            <option key={condition} value={condition}>
              {condition}
            </option>
          ))}
        </select>
      </div>

      {/* Location Radius Slider */}
      <div className="flex-1">
        <LocationRadiusSlider
          initialRadius={currentRadius}
          userLat={userLat}
          userLng={userLng}
        />
      </div>

      {/* Price Range Button (placeholder) */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price Range
        </label>
        <button
          onClick={handlePriceRange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm font-medium"
          aria-label="Set price range"
        >
          Any Price
        </button>
        <p className="text-xs text-gray-400 mt-1">Coming soon</p>
      </div>
    </div>
  )
}
