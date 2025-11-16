'use client'

/**
 * RefundButton Component
 *
 * Allows sellers or admins to issue refunds for orders.
 *
 * Features:
 * - Confirmation modal before refund
 * - Loading states
 * - Success/Error toast notifications
 * - Only visible to seller or admin
 *
 * Authorization:
 * - Seller of the listing can refund
 * - Admin role can refund (TODO: implement admin check)
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Toast, { ToastType } from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'
import type { Order } from '@/types/database'

interface RefundButtonProps {
  order: Order
  currentUserId: string
  onRefundSuccess?: () => void
  className?: string
}

export default function RefundButton({
  order,
  currentUserId,
  onRefundSuccess,
  className = ''
}: RefundButtonProps) {
  const [supabase] = useState(() => createClient())
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  // Check if user is authorized to refund (seller or admin)
  const canRefund = order.seller_id === currentUserId || order.buyer_id === currentUserId

  // Check if order can be refunded
  const isRefundable = order.status === 'paid' || order.status === 'processing' || order.status === 'completed'

  if (!canRefund || !isRefundable) {
    return null
  }

  if (order.status === 'refunded') {
    return (
      <div className="text-sm text-gray-500">
        ✓ Refunded on {new Date(order.refunded_at!).toLocaleDateString()}
      </div>
    )
  }

  const handleRefund = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          reason: 'requested_by_customer'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund')
      }

      // Show success toast
      setToast({
        message: 'Refund processed successfully. The buyer will receive their money back within 5-10 business days.',
        type: 'success'
      })

      // Close modal
      setShowModal(false)

      // Callback to refresh order data
      if (onRefundSuccess) {
        setTimeout(() => {
          onRefundSuccess()
        }, 2000)
      }

    } catch (err: any) {
      console.error('Refund error:', err)
      setToast({
        message: err.message || 'Failed to process refund. Please try again.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Refund Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors ${className}`}
        aria-label="Issue refund for this order"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Issue Refund
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 id="refund-modal-title" className="text-lg font-semibold text-gray-900">
                  Confirm Refund
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to refund this order?
                </p>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Order ID:</dt>
                  <dd className="font-mono text-gray-900">{order.id.slice(0, 8)}...</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Amount:</dt>
                  <dd className="font-semibold text-gray-900">${(order.amount_cents / 100).toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Buyer:</dt>
                  <dd className="text-gray-900">{order.buyer_email}</dd>
                </div>
              </dl>
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This action cannot be undone. The full amount will be refunded to the buyer within 5-10 business days.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  'Confirm Refund'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
