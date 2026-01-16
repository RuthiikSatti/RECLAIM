'use client'

import { updateReportStatus } from '@/lib/reports/actions'
import { useState } from 'react'
import Link from 'next/link'

interface ReportCardProps {
  report: {
    id: string
    reason: string
    status: string
    created_at: string
    reporter: {
      display_name: string
      email: string
    }
    listing: {
      id: string
      title: string
      description: string
    }
  }
}

export default function ReportCard({ report }: ReportCardProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(report.status)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleUpdateStatus(newStatus: 'resolved' | 'dismissed') {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await updateReportStatus(report.id, newStatus)

      if (result.error) {
        setError(result.error)
        console.error('[ReportCard] Update failed:', result.error)
      } else if (result.success) {
        setStatus(newStatus)
        setSuccessMessage(`Report ${newStatus === 'resolved' ? 'resolved' : 'dismissed'} successfully`)
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      console.error('[ReportCard] Exception:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-black',
  }[status]

  return (
    <div className="bg-white rounded-lg shadow-md p-6" data-testid="report-card" data-report-id={report.id}>
      {/* Success Toast */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2" data-testid="success-toast">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-800 text-sm">{successMessage}</span>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2" data-testid="error-toast">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-800 text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-black">
              Report for: {report.listing.title}
            </h3>
            <span
              className={'px-3 py-1 rounded-full text-sm font-medium ' + statusColor}
              data-testid="report-status"
            >
              {status}
            </span>
          </div>
          <p className="text-sm text-black mb-2">
            Reported by: {report.reporter.display_name} ({report.reporter.email})
          </p>
          <p className="text-sm text-black">
            {new Date(report.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="text-sm font-medium text-black mb-1">Reason:</p>
        <p className="text-black">{report.reason}</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-sm font-medium text-black mb-1">Listing Description:</p>
        <p className="text-black">{report.listing.description}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link
          href={'/item/' + report.listing.id}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          View Listing
        </Link>
        {status === 'pending' && (
          <>
            <button
              onClick={() => handleUpdateStatus('resolved')}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="resolve-button"
            >
              {loading ? 'Updating...' : 'Mark Resolved'}
            </button>
            <button
              onClick={() => handleUpdateStatus('dismissed')}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="dismiss-button"
            >
              {loading ? 'Updating...' : 'Dismiss'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
