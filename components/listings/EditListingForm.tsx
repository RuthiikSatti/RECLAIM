'use client'

import { updateListing } from '@/lib/listings/actions'
import ImageUploader from '@/components/listings/imageuploader'
import { useState } from 'react'

interface EditListingFormProps {
  listing: {
    id: string
    title: string
    description: string
    category: string
    price: number
    image_urls: string[]
  }
}

export default function EditListingForm({ listing }: EditListingFormProps) {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await updateListing(listing.id, formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  // Convert cents to dollars for display
  const priceInDollars = (listing.price / 100).toFixed(2)

  return (
    <form action={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-black">Title</label>
        <input
          name="title"
          required
          defaultValue={listing.title}
          className="mt-1 block w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black">Photos</label>
        <ImageUploader existingImages={listing.image_urls} />
        <p className="text-xs text-black mt-1">
          You can upload new images or keep existing ones.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-black">Description</label>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={listing.description}
          className="mt-1 block w-full border rounded px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black">Category</label>
          <select
            name="category"
            defaultValue={listing.category}
            className="mt-1 block w-full border rounded px-3 py-2"
          >
            <option>Dorm and Decor</option>
            <option>Fun and Craft</option>
            <option>Transportation</option>
            <option>Tech and Gadgets</option>
            <option>Books</option>
            <option>Clothing and Accessories</option>
            <option>Giveaways</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-black">Price (USD)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={priceInDollars}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-black mt-1">Price will be stored in cents.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <a
          href={`/item/${listing.id}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50"
        >
          Cancel
        </a>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Update Listing
        </button>
      </div>
    </form>
  )
}
