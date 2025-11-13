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

  async function handleUpdateStatus(newStatus: 'resolved' | 'dismissed') {
    setLoading(true)
    const result = await updateReportStatus(report.id, newStatus)
    if (!result.error) {
      setStatus(newStatus)
    }
    setLoading(false)
  }

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-black',
  }[status]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-black">
              Report for: {report.listing.title}
            </h3>
            <span className={'px-3 py-1 rounded-full text-sm font-medium ' + statusColor}>
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

      <div className="flex gap-2">
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
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Mark Resolved'}
            </button>
            <button
              onClick={() => handleUpdateStatus('dismissed')}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Dismiss'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
