import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Reclaim',
  description: 'RECLAIM Privacy Policy - How we collect, use, and protect your data',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f0' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="heading-primary text-black mb-4">
            PRIVACY POLICY
          </h1>
          <p className="text-sm text-black">
            Last updated: December 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 space-y-8 text-black">
          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Introduction</h2>
            <p className="leading-relaxed">
              Welcome to RECLAIM. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and protect your information when you use our student marketplace platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Information We Collect</h2>
            <div className="space-y-4 leading-relaxed">
              <div>
                <h3 className="font-semibold text-black mb-2">Account Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>University email address (for verification)</li>
                  <li>Display name/username</li>
                  <li>Profile information you choose to provide</li>
                  <li>Account credentials (encrypted)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-2">Listing Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Product listings you create (title, description, photos, price)</li>
                  <li>Categories and tags</li>
                  <li>Transaction history</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-2">Communication Data</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Messages sent through our chat system</li>
                  <li>Support inquiries and feedback</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-2">Usage Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Pages visited and features used</li>
                  <li>Search queries</li>
                  <li>Device and browser information</li>
                  <li>IP address and general location</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 leading-relaxed ml-4">
              <li>To provide and maintain our marketplace services</li>
              <li>To verify your university affiliation and create a safe community</li>
              <li>To facilitate communication between buyers and sellers</li>
              <li>To process transactions and maintain records</li>
              <li>To improve our platform and user experience</li>
              <li>To send important updates about your account or the service</li>
              <li>To prevent fraud and ensure platform safety</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Data Sharing and Disclosure</h2>
            <div className="space-y-4 leading-relaxed">
              <p>
                <strong className="text-black">We do not sell your personal information.</strong> We only share your data in the following limited circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-black">With Other Users:</strong> Your display name and listings are visible to other verified students on the platform.</li>
                <li><strong className="text-black">Service Providers:</strong> We use trusted third-party services (hosting, analytics, email) that help us operate the platform.</li>
                <li><strong className="text-black">Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety.</li>
                <li><strong className="text-black">Business Transfers:</strong> In the event of a merger or acquisition, user data may be transferred to the new entity.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Data Security</h2>
            <p className="leading-relaxed">
              We implement industry-standard security measures to protect your personal information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 leading-relaxed mt-4 ml-4">
              <li>Encrypted data transmission (HTTPS/SSL)</li>
              <li>Secure password hashing</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
              <li>Secure cloud infrastructure</li>
            </ul>
            <p className="leading-relaxed mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Your Rights and Choices</h2>
            <p className="leading-relaxed mb-4">You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-2 leading-relaxed ml-4">
              <li><strong className="text-black">Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong className="text-black">Correction:</strong> Update or correct your profile information at any time</li>
              <li><strong className="text-black">Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong className="text-black">Data Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong className="text-black">Opt-Out:</strong> Unsubscribe from marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Cookies and Tracking</h2>
            <p className="leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyze usage, and remember your preferences. You can control cookie settings through your browser, but some features may not function properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Data Retention</h2>
            <p className="leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will remove your personal data within 30 days, except where we are required to retain it for legal or compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Children's Privacy</h2>
            <p className="leading-relaxed">
              Our service is intended for university students (typically 18+). We do not knowingly collect personal information from anyone under 13 years of age. If we discover that we have collected data from a child under 13, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Third-Party Links</h2>
            <p className="leading-relaxed">
              Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-black mb-4">Contact Us</h2>
            <p className="leading-relaxed">
              If you have questions about this Privacy Policy or how we handle your data, please contact us:
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <strong className="text-black">Email:</strong>{' '}
                <a href="mailto:privacy@reclaim.app" className="text-blue-600 hover:text-blue-700 underline">
                  privacy@reclaim.app
                </a>
              </li>
              <li>
                <strong className="text-black">Contact Form:</strong>{' '}
                <a href="/contact" className="text-blue-600 hover:text-blue-700 underline">
                  Contact Us
                </a>
              </li>
            </ul>
          </section>

          <section className="bg-gray-50 p-6 rounded-lg mt-8">
            <p className="text-sm text-black leading-relaxed">
              <strong className="text-black">Note:</strong> This is a sample privacy policy for the RECLAIM platform. For a production environment, this policy should be reviewed and customized by legal counsel to ensure compliance with applicable privacy laws (GDPR, CCPA, etc.) and your specific business practices.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
