export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Placeholder:</strong> This is a placeholder Terms of Service page.
              Please consult with a lawyer to create proper terms before launching.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using RECLAIM, you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="text-gray-700 mb-2">
              To use RECLAIM, you must:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Be a current student with a valid university .edu email address</li>
              <li>Be at least 18 years old</li>
              <li>Provide accurate and truthful information</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-700 mb-2">
              You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Provide accurate descriptions of items for sale</li>
              <li>Honor all transactions initiated through the platform</li>
              <li>Not engage in fraudulent or deceptive practices</li>
              <li>Not post prohibited items or content</li>
              <li>Respect other users and maintain a safe community</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Prohibited Items</h2>
            <p className="text-gray-700 mb-2">
              The following items are prohibited on RECLAIM:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Illegal items or services</li>
              <li>Weapons, drugs, or controlled substances</li>
              <li>Stolen goods</li>
              <li>Counterfeit or pirated items</li>
              <li>Items that violate intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payment and Fees</h2>
            <p className="text-gray-700">
              RECLAIM charges a 10% platform fee on all transactions. Payment processing
              is handled securely through Stripe. Refunds are subject to our refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy</h2>
            <p className="text-gray-700">
              Your privacy is important to us. Please review our Privacy Policy to understand
              how we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700">
              RECLAIM is a platform that facilitates transactions between users. We are not
              responsible for the quality, safety, or legality of items listed, the accuracy
              of listings, the ability of sellers to complete transactions, or the ability of
              buyers to pay for items.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Account Termination</h2>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate accounts that violate these terms
              or engage in fraudulent or harmful behavior.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these terms at any time. Changes will be effective
              immediately upon posting to the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-700">
              For questions about these terms, please contact us at support@reclaimcampus.com
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Last updated: November 16, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
