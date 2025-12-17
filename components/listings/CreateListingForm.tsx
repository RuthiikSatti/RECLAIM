'use client'

import { useState } from 'react'
import { createListing, uploadImage } from '@/lib/listings/actions'
import { trackEvent } from '@/lib/mixpanel/client'

const categories = ['Electronics', 'Textbooks', 'Furniture', 'Clothing', 'Other']

export default function CreateListingForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadImage(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        setImageUrls([...imageUrls, result.url])
      }
    } catch (err) {
      setError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    formData.append('imageUrls', JSON.stringify(imageUrls))

    trackEvent('create_listing', {
      category: formData.get('category'),
      price: formData.get('price'),
      has_images: imageUrls.length > 0,
    })

    const result = await createListing(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {error && (
        <div className="bg-white border-2 border-black p-4 rounded-lg">
          <p className="text-black">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="e.g., iPhone 13 Pro"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          required
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Describe your item..."
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          name="category"
          id="category"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
          Price ($)
        </label>
        <input
          type="number"
          name="price"
          id="price"
          required
          min="0"
          step="0.01"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Images
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading || imageUrls.length >= 5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
        {uploading && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
        {imageUrls.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative h-24 bg-gray-100 rounded">
                <img src={url} alt={'Image ' + (i + 1)} className="w-full h-full object-cover rounded" />
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || imageUrls.length === 0}
        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Listing'}
      </button>
    </form>
  )
}
