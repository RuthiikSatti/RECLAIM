import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - Reclaim',
  description: 'Learn about RECLAIM - the student marketplace built for students, by students',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="maintanker-title tracking-maintanker text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-4">
            ABOUT US
          </h1>
          <p className="text-xl text-gray-600">
            For students, by students
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              RECLAIM is a student-focused marketplace designed to make buying and selling within your university community safe, simple, and sustainable. We believe students should have an easy way to find great deals on textbooks, furniture, electronics, and more from verified classmates they can trust.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why RECLAIM?</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">Built for Students:</strong> We understand the unique needs of college students. From dorm furniture to textbooks, our platform is tailored specifically for campus life.
              </p>
              <p>
                <strong className="text-gray-900">Safe & Verified:</strong> Every user is verified through their university email, ensuring you're only trading with fellow students from your campus community.
              </p>
              <p>
                <strong className="text-gray-900">Sustainable:</strong> Reduce waste and save money by giving items a second life. Buy and sell pre-loved goods instead of buying new.
              </p>
              <p>
                <strong className="text-gray-900">Real-Time Chat:</strong> Message sellers instantly to ask questions, negotiate prices, and arrange convenient pickup times.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Sign Up with Your Student Email</h3>
                <p>Create an account using your verified university email address to join your campus community.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Browse or List Items</h3>
                <p>Search for items you need or post your own listings with photos and descriptions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Connect & Trade</h3>
                <p>Use our real-time chat to connect with buyers or sellers, negotiate, and arrange meetups on campus.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Values</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
              <li><strong className="text-gray-900">Safety First:</strong> Verified student-only community</li>
              <li><strong className="text-gray-900">Transparency:</strong> Clear pricing and honest descriptions</li>
              <li><strong className="text-gray-900">Sustainability:</strong> Promoting reuse and reducing waste</li>
              <li><strong className="text-gray-900">Community:</strong> Building connections among students</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Ready to start buying and selling? Join thousands of students already using RECLAIM to find great deals and connect with their campus community.
            </p>
            <div className="flex gap-4">
              <a
                href="/marketplace"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Marketplace
              </a>
              <a
                href="/signup"
                className="inline-block bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Sign Up
              </a>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              Have questions or feedback? We'd love to hear from you!{' '}
              <a href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold underline">
                Get in touch
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
