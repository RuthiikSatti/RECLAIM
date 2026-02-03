export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-ume-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="heading-primary mb-8">TERMS OF SERVICE</h1>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="py-12">
            <svg
              className="w-24 h-24 mx-auto mb-6 text-ume-indigo"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-ume-indigo mb-4">
              Terms & Conditions Coming Soon
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              We're currently finalizing our Terms of Service. Please check back soon for the complete terms and conditions.
            </p>
            <p className="mt-6 text-sm text-gray-500">
              Questions? Contact us at{' '}
              <a href="mailto:umelife.official@gmail.com" className="text-ume-pink hover:underline">
                umelife.official@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
