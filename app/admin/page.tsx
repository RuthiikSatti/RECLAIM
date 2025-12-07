import { getAllReports } from '@/lib/reports/actions'
import ReportCard from '@/components/admin/ReportCard'

export default async function AdminPage() {
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
