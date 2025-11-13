import { getAllReports } from '@/lib/reports/actions'
import Navbar from '@/components/layout/Navbar'
import ReportCard from '@/components/admin/ReportCard'

export default async function AdminPage() {
  const result = await getAllReports()
  const reports = result.reports || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Admin Moderation Panel
          </h1>
          <p className="text-black">Review and manage reported listings</p>
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
