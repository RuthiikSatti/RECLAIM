'use client'

import Link from 'next/link'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-ume-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-black mb-2">
            Password Reset Temporarily Disabled
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Password reset functionality is currently under maintenance. Please try again later or contact support for assistance.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm font-medium text-black hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
