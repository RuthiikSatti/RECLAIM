// app/create/page.tsx
import type { Metadata } from 'next'
import { handleCreateListing } from './actions' // server action (Note relative path)
import ImageUploaderClean from '@/components/listings/ImageUploaderClean'


export const metadata: Metadata = {
  title: 'Create Listing - UME',
}

export default function CreateListingPage() {
  return (
    <div className="min-h-screen bg-ume-bg py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="heading-primary mb-12">
          CREATE LISTING
        </h1>

        {/* Server form — uses the server action exported in app/create/actions.ts */}
        <form action={handleCreateListing} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm text-black mb-2">
              Title <span className="text-gray-500">(required)</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              aria-required="true"
              className="w-full border border-gray-900 rounded-full px-6 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
              placeholder="Enter listing title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm text-black mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              aria-required="true"
              rows={4}
              className="w-full border border-gray-900 rounded-3xl px-6 py-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none placeholder-gray-400"
              placeholder="Describe your item"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm text-black mb-2">
              Category <span className="text-gray-500">(required)</span>
            </label>
            <div className="relative">
              <select
                id="category"
                name="category"
                required
                aria-required="true"
                className="w-full border border-gray-900 rounded-full px-6 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none cursor-pointer"
              >
                <option value="">Select an option</option>
                <option value="Dorm and Decor">Dorm and Decor</option>
                <option value="Fun and Craft">Fun and Craft</option>
                <option value="Transportation">Transportation</option>
                <option value="Tech and Gadgets">Tech and Gadgets</option>
                <option value="Books">Books</option>
                <option value="Clothing and Accessories">Clothing and Accessories</option>
                <option value="Giveaways">Giveaways</option>
                <option value="Other">Other</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Condition */}
          <div role="group" aria-labelledby="condition-label">
            <label id="condition-label" className="block text-sm text-black mb-2">
              Condition <span className="text-gray-500">(required)</span>
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="condition"
                  value="New"
                  required
                  aria-required="true"
                  className="w-4 h-4 border-2 border-gray-900 text-black focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-pointer"
                />
                <span className="text-sm text-black group-hover:text-black">New</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="condition"
                  value="Like New"
                  className="w-4 h-4 border-2 border-gray-900 text-black focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-pointer"
                />
                <span className="text-sm text-black group-hover:text-black">Like New</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="condition"
                  value="Used"
                  defaultChecked
                  className="w-4 h-4 border-2 border-gray-900 text-black focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-pointer"
                />
                <span className="text-sm text-black group-hover:text-black">Used</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="condition"
                  value="Refurbished"
                  className="w-4 h-4 border-2 border-gray-900 text-black focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-pointer"
                />
                <span className="text-sm text-black group-hover:text-black">Refurbished</span>
              </label>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm text-black mb-2" htmlFor="image-upload">
              Photos <span className="text-gray-500">(required)</span>
            </label>
            <ImageUploaderClean />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm text-black mb-2">
              Price <span className="text-gray-500">(required)</span>
            </label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-black font-medium" aria-hidden="true">$</span>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                required
                aria-required="true"
                aria-label="Price in dollars"
                className="w-full border border-gray-900 rounded-full pl-10 pr-6 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
                placeholder="0"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="bg-ume-pink text-white font-semibold px-12 py-4 rounded-full hover:bg-pink-400 focus:outline-none focus:ring-2 focus:ring-ume-pink focus:ring-offset-2 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Submit listing"
            >
              Post Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
