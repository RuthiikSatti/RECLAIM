export default function SafetyTipsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Safety Tips</h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-sm text-blue-800">
              Your safety is our priority. Follow these guidelines to ensure secure transactions
              on RECLAIM.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🚫 No In-Person Meetups
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">
                IMPORTANT: Do NOT arrange in-person meetups through RECLAIM
              </p>
              <p className="text-red-700">
                All transactions must be completed through our platform with shipping.
                In-person transactions are NOT supported and may result in account termination.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              ✅ General Safety Guidelines
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  <strong>Only transact through the platform:</strong> Never send money outside
                  of RECLAIM's payment system.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  <strong>Verify seller ratings:</strong> Check seller history and reviews
                  before purchasing.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  <strong>Use secure shipping:</strong> Ship with tracking and delivery
                  confirmation.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  <strong>Keep communications on-platform:</strong> Use RECLAIM messaging
                  for all buyer-seller communications.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>
                  <strong>Report suspicious activity:</strong> Flag inappropriate listings
                  or suspicious behavior immediately.
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🛡️ For Buyers
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Review item descriptions and photos carefully before purchasing</li>
              <li>Ask questions through messaging if details are unclear</li>
              <li>Keep records of all communications and transactions</li>
              <li>Report items that don't match their description</li>
              <li>Contact support immediately if you don't receive your item</li>
              <li>Never send additional payment outside the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              📦 For Sellers
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Provide accurate descriptions and clear photos of items</li>
              <li>Ship items promptly after receiving payment</li>
              <li>Provide tracking numbers to buyers</li>
              <li>Package items securely to prevent damage during shipping</li>
              <li>Respond to buyer messages in a timely manner</li>
              <li>Never ask buyers to pay outside the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              ⚠️ Red Flags to Watch For
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-red-600 font-bold mt-1">⚠</span>
                <span>Requests to communicate or pay outside the platform</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 font-bold mt-1">⚠</span>
                <span>Prices that seem too good to be true</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 font-bold mt-1">⚠</span>
                <span>Sellers requesting upfront payment before listing items</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 font-bold mt-1">⚠</span>
                <span>Pressure to complete transactions quickly</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 font-bold mt-1">⚠</span>
                <span>Requests for personal information beyond what's necessary</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 font-bold mt-1">⚠</span>
                <span>Items that violate our prohibited items policy</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🚨 Reporting Issues
            </h2>
            <p className="text-gray-700 mb-4">
              If you encounter any of the following, please report immediately:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Fraudulent listings or sellers</li>
              <li>Items that violate our terms of service</li>
              <li>Harassment or abusive behavior</li>
              <li>Suspected scams or phishing attempts</li>
              <li>Counterfeit or stolen goods</li>
            </ul>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-800">
                <strong>To report an issue:</strong> Click the "Report" button on any listing,
                or email us at <a href="mailto:support@reclaimcampus.com" className="text-blue-600 hover:underline">support@reclaimcampus.com</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              💬 Getting Help
            </h2>
            <p className="text-gray-700">
              Our support team is here to help. If you have questions or concerns about a
              transaction, please contact us at support@reclaimcampus.com
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
