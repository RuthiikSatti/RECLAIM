'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

/**
 * FiltersRow Component
 *
 * Contains all filter controls:
 * - Sort dropdown (Relevance, Newest, Price Low to High, Price High to Low)
 * - Condition dropdown
 * - Price preset options
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

const PRICE_OPTIONS = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 to $50', min: 25, max: 50 },
  { label: '$50 to $100', min: 50, max: 100 },
  { label: '$100 to $200', min: 100, max: 200 },
  { label: '$200 & above', min: 200, max: null },
]

export default function FiltersRow({
  currentCondition,
  currentSort,
  currentMinPrice,
  currentMaxPrice
}: FiltersRowProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [priceOpen, setPriceOpen] = useState(false)
  const [conditionOpen, setConditionOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  // Get current price label
  const getCurrentPriceLabel = () => {
    if (!currentMinPrice && !currentMaxPrice) return 'Price'
    const min = currentMinPrice ? parseFloat(currentMinPrice) : 0
    const max = currentMaxPrice ? parseFloat(currentMaxPrice) : null

    for (const option of PRICE_OPTIONS) {
      if (option.min === min && option.max === max) return option.label
    }
    return 'Price'
  }

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (sort === 'relevance') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }

    router.push(`/marketplace?${params.toString()}`)
    setSortOpen(false)
  }

  const handleConditionChange = (condition: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (condition === 'all') {
      params.delete('condition')
    } else {
      params.set('condition', condition)
    }

    router.push(`/marketplace?${params.toString()}`)
    setConditionOpen(false)
  }

  const handlePriceSelect = (min: number, max: number | null) => {
    const params = new URLSearchParams(searchParams.toString())

    // Convert dollars to cents for backend
    params.set('minPrice', (min * 100).toString())

    if (max !== null) {
      params.set('maxPrice', (max * 100).toString())
    } else {
      params.delete('maxPrice')
    }

    router.push(`/marketplace?${params.toString()}`)
    setPriceOpen(false)
  }

  const handleClearPrice = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('minPrice')
    params.delete('maxPrice')
    router.push(`/marketplace?${params.toString()}`)
    setPriceOpen(false)
  }

  return (
    <div className="hidden md:block mb-6">
      {/* Single Row: Sort, Condition, and Price */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setSortOpen(!sortOpen); setConditionOpen(false); setPriceOpen(false) }}
            className="flex items-center gap-2 text-sm text-gray-900 hover:text-ume-indigo transition-colors"
            aria-label="Sort listings"
          >
            <span>{SORT_OPTIONS.find(o => o.value === (currentSort || 'relevance'))?.label || 'Relevance'}</span>
            <svg
              className={`w-4 h-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {sortOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px]">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    (currentSort || 'relevance') === option.value ? 'text-ume-indigo font-medium' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-gray-300">|</span>

        {/* Condition Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setConditionOpen(!conditionOpen); setSortOpen(false); setPriceOpen(false) }}
            className="flex items-center gap-2 text-sm text-gray-900 hover:text-ume-indigo transition-colors"
            aria-label="Filter by condition"
          >
            <span>{currentCondition || 'Condition'}</span>
            <svg
              className={`w-4 h-4 transition-transform ${conditionOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {conditionOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
              <button
                onClick={() => handleConditionChange('all')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  !currentCondition ? 'text-ume-indigo font-medium' : 'text-gray-900'
                }`}
              >
                All
              </button>
              {CONDITIONS.map((condition) => (
                <button
                  key={condition}
                  onClick={() => handleConditionChange(condition)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    currentCondition === condition ? 'text-ume-indigo font-medium' : 'text-gray-900'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-gray-300">|</span>

        {/* Price Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setPriceOpen(!priceOpen); setSortOpen(false); setConditionOpen(false) }}
            className="flex items-center gap-2 text-sm text-gray-900 hover:text-ume-indigo transition-colors"
            aria-label="Filter by price"
          >
            <span>{getCurrentPriceLabel()}</span>
            <svg
              className={`w-4 h-4 transition-transform ${priceOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {priceOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
              {(currentMinPrice || currentMaxPrice) && (
                <button
                  onClick={handleClearPrice}
                  className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                >
                  Clear filter
                </button>
              )}
              {PRICE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handlePriceSelect(option.min, option.max)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    getCurrentPriceLabel() === option.label ? 'text-ume-indigo font-medium' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
