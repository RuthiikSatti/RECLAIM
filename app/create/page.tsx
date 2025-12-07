// app/create/page.tsx
import type { Metadata } from 'next'
import { handleCreateListing } from './actions' // server action (Note relative path)
// near other imports in app/create/page.tsx (server file)
import ImageUploader from '@/components/listings/imageuploader'


export const metadata: Metadata = {
  title: 'Create Listing - Reclaim',
}

export default function CreateListingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">Create Listing</h1>

        {/* Server form — uses the server action exported in app/create/actions.ts */}
        <form action={handleCreateListing} className="space-y-6 bg-white p-6 rounded shadow">
          <div>
            <label className="block text-sm font-medium text-black">Title</label>
            <input name="title" required className="mt-1 block w-full border rounded px-3 py-2 text-black" />
          </div>
          {/* Photos uploader */}
          <div>
            <label className="block text-sm font-medium text-black">Photos</label>
            <ImageUploader />
            <p className="text-xs text-black mt-1">You can upload multiple images. They will be attached to the listing.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-black">Description</label>
            <textarea
              name="description"
              required
              rows={4}
              className="mt-1 block w-full border rounded px-3 py-2 text-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black">Category</label>
              <select name="category" className="mt-1 block w-full border rounded px-3 py-2 text-black">
                <option>Dorm and Decor</option>
                <option>Fun and Craft</option>
                <option>Transportation</option>
                <option>Tech and Gadgets</option>
                <option>Books</option>
                <option>Clothing and Accessories</option>
                <option>Giveaways</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black">Condition</label>
              <select name="condition" required defaultValue="Used" className="mt-1 block w-full border rounded px-3 py-2 text-black">
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Used">Used</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black">Price (USD)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              className="mt-1 block w-full border rounded px-3 py-2 text-black"
            />
            <p className="text-xs text-black mt-1">Price will be stored in cents.</p>
          </div>

          {/* If you add ImageUploader later, include a hidden input named "imageUrls" with JSON array of URLs */}

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Post Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
