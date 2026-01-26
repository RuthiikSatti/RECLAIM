'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { X } from '@phosphor-icons/react'

/**
 * MobileFilters Component
 *
 * Mobile-only filter drawer for marketplace filtering.
 * Features:
 * - Sort dropdown
 * - Condition dropdown
 * - Price range inputs
 * - Apply and Clear buttons
 * - Slides in from bottom
 */

interface MobileFiltersProps {
  isOpen: boolean
  onClose: () => void
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

export default function MobileFilters({
  isOpen,
  onClose,
  currentCondition,
  currentSort,
  currentMinPrice,
  currentMaxPrice
}: MobileFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sort, setSort] = useState(currentSort || 'relevance')
  const [condition, setCondition] = useState(currentCondition || 'all')
  const [selectedPriceOption, setSelectedPriceOption] = useState<string>('')

  // Determine current price option from props
  const getCurrentPriceOption = () => {
    if (!currentMinPrice && !currentMaxPrice) return ''
    const min = currentMinPrice ? parseFloat(currentMinPrice) : 0
    const max = currentMaxPrice ? parseFloat(currentMaxPrice) : null
    for (const option of PRICE_OPTIONS) {
      if (option.min === min && option.max === max) return option.label
    }
    return ''
  }

  // Update local state when props change
  useEffect(() => {
    setSort(currentSort || 'relevance')
    setCondition(currentCondition || 'all')
    setSelectedPriceOption(getCurrentPriceOption())
  }, [currentSort, currentCondition, currentMinPrice, currentMaxPrice])

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Sort
    if (sort === 'relevance') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }

    // Condition
    if (condition === 'all') {
      params.delete('condition')
    } else {
      params.set('condition', condition)
    }

    // Price
    if (selectedPriceOption) {
      const option = PRICE_OPTIONS.find(o => o.label === selectedPriceOption)
      if (option) {
        params.set('minPrice', (option.min * 100).toString())
        if (option.max !== null) {
          params.set('maxPrice', (option.max * 100).toString())
        } else {
          params.delete('maxPrice')
        }
      }
    } else {
      params.delete('minPrice')
      params.delete('maxPrice')
    }

    router.push(`/marketplace?${params.toString()}`)
    onClose()
  }

  const handleClearFilters = () => {
    setSort('relevance')
    setCondition('all')
    setSelectedPriceOption('')

    const params = new URLSearchParams(searchParams.toString())
    params.delete('sort')
    params.delete('condition')
    params.delete('minPrice')
    params.delete('maxPrice')

    router.push(`/marketplace?${params.toString()}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 md:hidden max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close filters"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="all">All Conditions</option>
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Price
            </label>
            <select
              value={selectedPriceOption}
              onChange={(e) => setSelectedPriceOption(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">All Prices</option>
              {PRICE_OPTIONS.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClearFilters}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-4 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )
}
