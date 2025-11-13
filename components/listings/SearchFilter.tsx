'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const categories = ['All', 'Dorm and Decor', 'Fun and Craft', 'Transportation', 'Tech and Gadgets', 'Books', 'Clothing and Accessories', 'Giveaways']

export default function SearchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'All')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category !== 'All') params.set('category', category)
    router.push('/marketplace?' + params.toString())
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (newCategory !== 'All') params.set('category', newCategory)
    router.push('/marketplace?' + params.toString())
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </form>
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={'px-4 py-2 rounded-lg ' + (
              category === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}
