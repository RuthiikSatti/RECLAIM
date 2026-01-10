'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

/**
 * FiltersRow Component
 *
 * Contains all filter controls:
 * - Sort dropdown (Relevance, Newest, Price Low to High, Price High to Low)
 * - Condition dropdown
 * - Price range filters (min/max)
 */

interface FiltersRowProps {
  currentCondition?: string
  currentSort?: string
  currentMinPrice?: string
  currentMaxPrice?: string
}

const CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished']
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

export default function FiltersRow({
  currentCondition,
  currentSort,
  currentMinPrice,
  currentMaxPrice
}: FiltersRowProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [minPrice, setMinPrice] = useState(currentMinPrice || '')
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice || '')

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (sort === 'relevance') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }

    router.push(`/marketplace?${params.toString()}`)
  }

  const handleConditionChange = (condition: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (condition === 'all') {
      params.delete('condition')
    } else {
      params.set('condition', condition)
    }

    router.push(`/marketplace?${params.toString()}`)
  }

  const handlePriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (minPrice) {
      // Convert dollars to cents for backend
      params.set('minPrice', (parseFloat(minPrice) * 100).toString())
    } else {
      params.delete('minPrice')
    }

    if (maxPrice) {
      // Convert dollars to cents for backend
      params.set('maxPrice', (parseFloat(maxPrice) * 100).toString())
    } else {
      params.delete('maxPrice')
    }

    router.push(`/marketplace?${params.toString()}`)
  }

  const handleClearPriceFilter = () => {
    setMinPrice('')
    setMaxPrice('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('minPrice')
    params.delete('maxPrice')
    router.push(`/marketplace?${params.toString()}`)
  }

  return (
    <div className="mb-6">
      {/* Single Row: Sort, Condition, and Price Range */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sort Dropdown */}
        <div>
          <select
            value={currentSort || 'relevance'}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 cursor-pointer"
            aria-label="Sort listings"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Condition Dropdown */}
        <div>
          <select
            value={currentCondition || 'all'}
            onChange={(e) => handleConditionChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 cursor-pointer"
            aria-label="Filter by condition"
          >
            <option value="all">Condition</option>
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Price:</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-24 pl-6 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              min="0"
              step="1"
            />
          </div>
          <span className="text-gray-500">—</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 pl-6 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              min="0"
              step="1"
            />
          </div>
          <button
            onClick={handlePriceFilter}
            className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Apply price filter"
          >
            Apply
          </button>
          {(currentMinPrice || currentMaxPrice) && (
            <button
              onClick={handleClearPriceFilter}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Clear price filter"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
