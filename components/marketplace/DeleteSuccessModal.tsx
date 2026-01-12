'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DeleteSuccessModal() {
  const [showModal, setShowModal] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('deleted') === 'success') {
      setShowModal(true)
    }
  }, [searchParams])

  const handleClose = () => {
    setShowModal(false)
    // Remove the query parameter from URL without triggering a navigation
    router.replace('/marketplace', { scroll: false })
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Listing Deleted
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Your listing has been successfully deleted.
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
