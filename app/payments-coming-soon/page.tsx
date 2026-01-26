import Link from 'next/link'

export default function PaymentsComingSoonPage() {
  return (
    <div className="min-h-screen bg-ume-bg">

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 bg-ume-cream rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-ume-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="heading-primary mb-4">
            PAYMENTS COMING SOON
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            We're finalizing secure payment processing for <span className="text-ume-indigo font-semibold">U</span><span className="text-ume-pink font-semibold">M</span><span className="text-ume-pink font-semibold">E</span>. Our team is working hard to bring you a safe and seamless checkout experience.
          </p>

          {/* Info Box */}
          <div className="bg-ume-cream border border-ume-indigo/20 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-ume-indigo mb-3">What's happening:</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-ume-pink mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Completing business registration and licensing</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-ume-pink mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Setting up secure payment processing with Stripe</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-ume-pink mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Testing and verifying all security measures</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Link
              href="/marketplace"
              className="inline-block bg-ume-indigo text-white px-8 py-3 rounded-lg font-semibold hover:bg-ume-indigo/90 transition-colors"
            >
              Browse Marketplace
            </Link>

            <p className="text-sm text-gray-500">
              You can still browse listings and connect with sellers in the meantime!
            </p>
          </div>

          {/* Footer Note */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Have questions? Check back soon for updates or contact us for more information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
