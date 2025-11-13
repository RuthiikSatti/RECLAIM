'use client'

import { reportListing } from '@/lib/reports/actions'
import { useState } from 'react'

export default function ReportButton({ listingId }: { listingId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleReport(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await reportListing(listingId, reason)
    
    if (!result.error) {
      setSuccess(true)
      setTimeout(() => {
        setShowModal(false)
        setSuccess(false)
        setReason('')
      }, 2000)
    }

    setLoading(false)
  }

  if (!showModal) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="text-red-600 hover:text-red-700 text-sm underline"
      >
        Report listing
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-black">Report Listing</h3>
        
        {success ? (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800">Report submitted successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleReport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Reason for reporting
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                placeholder="Please describe why you're reporting this listing..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 text-black py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
