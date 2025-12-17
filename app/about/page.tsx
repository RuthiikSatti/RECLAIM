import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - Reclaim',
  description: 'Learn about RECLAIM - the student marketplace built for students, by students',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f0' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="heading-primary text-black mb-4">
            ABOUT US
          </h1>
          <p className="text-xl text-black">
            For students, by students
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Our Mission</h2>
            <p className="text-black leading-relaxed">
              RECLAIM is a student-focused marketplace designed to make buying and selling within your university community safe, simple, and sustainable. We believe students should have an easy way to find great deals on textbooks, furniture, electronics, and more from verified classmates they can trust.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Why RECLAIM?</h2>
            <div className="space-y-4 text-black leading-relaxed">
              <p>
                <strong className="text-black">Built for Students:</strong> We understand the unique needs of college students. From dorm furniture to textbooks, our platform is tailored specifically for campus life.
              </p>
              <p>
                <strong className="text-black">Safe & Verified:</strong> Every user is verified through their university email, ensuring you're only trading with fellow students from your campus community.
              </p>
              <p>
                <strong className="text-black">Sustainable:</strong> Reduce waste and save money by giving items a second life. Buy and sell pre-loved goods instead of buying new.
              </p>
              <p>
                <strong className="text-black">Real-Time Chat:</strong> Message sellers instantly to ask questions, negotiate prices, and arrange convenient pickup times.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">How It Works</h2>
            <div className="space-y-4 text-black leading-relaxed">
              <div>
                <h3 className="font-semibold text-black mb-2">1. Sign Up with Your Student Email</h3>
                <p>Create an account using your verified university email address to join your campus community.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-2">2. Browse or List Items</h3>
                <p>Search for items you need or post your own listings with photos and descriptions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-2">3. Connect & Trade</h3>
                <p>Use our real-time chat to connect with buyers or sellers, negotiate, and arrange meetups on campus.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Our Values</h2>
            <ul className="list-disc list-inside space-y-2 text-black leading-relaxed">
              <li><strong className="text-black">Safety First:</strong> Verified student-only community</li>
              <li><strong className="text-black">Transparency:</strong> Clear pricing and honest descriptions</li>
              <li><strong className="text-black">Sustainability:</strong> Promoting reuse and reducing waste</li>
              <li><strong className="text-black">Community:</strong> Building connections among students</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-4">Get Started</h2>
            <p className="text-black leading-relaxed mb-6">
              Ready to start buying and selling? Join thousands of students already using RECLAIM to find great deals and connect with their campus community.
            </p>
            <div className="flex gap-4">
              <a
                href="/marketplace"
                className="inline-block bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Browse Marketplace
              </a>
              <a
                href="/signup"
                className="inline-block bg-white text-black border-2 border-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Sign Up
              </a>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-black mb-4">Contact Us</h2>
            <p className="text-black leading-relaxed">
              Have questions or feedback? We'd love to hear from you!{' '}
              <a href="/contact" className="text-black hover:text-gray-700 font-semibold underline">
                Get in touch
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
