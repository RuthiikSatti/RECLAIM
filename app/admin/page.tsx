import { getAllReports } from '@/lib/reports/actions'
import ReportCard from '@/components/admin/ReportCard'
import { verifyAdmin } from '@/lib/admin/verify'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  // Verify admin access
  try {
    await verifyAdmin()
  } catch (error) {
    // User is not an admin - show unauthorized page
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access the admin panel. Only authorized administrators can view this page.
          </p>
          <Link
            href="/marketplace"
            className="inline-block bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  const result = await getAllReports()
  const reports = result.reports || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">
              Admin Moderation Panel
            </h1>
            <p className="text-black">Review and manage reported listings</p>
          </div>
          <a 
            href="/api/admin/export-reports"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </a>
        </div>

        {result.error && (
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <p className="text-red-800">Error loading reports: {result.error}</p>
          </div>
        )}

        <div className="grid gap-4">
          {reports.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-black">No reports to review</p>
            </div>
          )} 
          {reports.map((report: any) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </div>
    </div>
  )
}
