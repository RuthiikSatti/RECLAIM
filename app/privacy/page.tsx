import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - UME',
  description: 'UME Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ume-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-ume-indigo mb-2">
            PRIVACY POLICY
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Our privacy policy is currently being updated. Please check back later for more information.
          </p>
          <Link
            href="/"
            className="inline-block text-sm font-medium text-ume-indigo hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
