'use client'

import { deleteListing } from '@/lib/listings/actions'
import { useState } from 'react'

export default function DeleteListingButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await deleteListing(listingId)
    // The server action will handle the redirect
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="bg-black text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-800"
      >
        Delete
      </button>
    )
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="bg-black text-white px-2 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Deleting...' : 'Confirm'}
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
      >
        Cancel
      </button>
    </div>
  )
}
