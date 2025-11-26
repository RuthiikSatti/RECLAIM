import Link from 'next/link'
import { getUser } from '@/lib/auth/actions'

export default async function Home() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Three-column grid layout: left | center | right */}
          <div className="grid h-[55px] items-center grid-cols-[1fr_auto_1fr]">
            {/* Left slot */}
            <div className="flex flex-1 justify-start shrink-0 max-w-[30%] min-w-fit px-[11px]">
              {user && (
                <Link
                  href="/marketplace"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis font-medium transition-colors"
                >
                  Marketplace
                </Link>
              )}
            </div>

            {/* Center slot */}
            <div className="flex flex-grow h-[55px] items-center justify-self-center overflow-hidden">
              <div className="w-full text-sm font-medium overflow-hidden whitespace-nowrap text-center text-ellipsis">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RECLAIM
                </h1>
              </div>
            </div>

            {/* Right slot */}
            <div className="flex shrink-0 max-w-[30%] min-w-fit px-[11px] justify-self-end">
              <div className="flex gap-4">
                {user ? (
                  <Link
                    href={`/profile/${user.id}`}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis font-medium transition-colors"
                  >
                    Profile
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis font-medium transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-full whitespace-nowrap overflow-hidden text-ellipsis font-medium transition-all shadow-sm hover:shadow-md"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-60"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="text-center">
            <div className="inline-block mb-4 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              🎓 Trusted by University Students
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Your Campus
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Marketplace
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Buy and sell items safely within your university community.
              <span className="block mt-2 font-semibold text-gray-800">Verified .edu students only.</span>
            </p>
            {!user && (
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-10 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  Get Started →
                </Link>
                <Link
                  href="/marketplace"
                  className="bg-white text-gray-700 hover:bg-gray-50 px-10 py-4 rounded-full font-semibold text-lg border-2 border-gray-200 transition-all hover:border-gray-300"
                >
                  Browse Items
                </Link>
              </div>
            )}
            {user && (
              <Link
                href="/marketplace"
                className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-10 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                Browse Marketplace →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Students Love RECLAIM</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A safer, simpler way to buy and sell on campus
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all hover:shadow-xl">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full filter blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Verified Students</h3>
                <p className="text-gray-600 leading-relaxed">
                  .edu email verification ensures you're trading within your trusted campus community.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-gray-100 hover:border-purple-200 transition-all hover:shadow-xl">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full filter blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Real-time Chat</h3>
                <p className="text-gray-600 leading-relaxed">
                  Message sellers instantly and arrange pickups with built-in messaging.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border border-gray-100 hover:border-green-200 transition-all hover:shadow-xl">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full filter blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Safe & Simple</h3>
                <p className="text-gray-600 leading-relaxed">
                  Report inappropriate listings and trade with confidence in a secure environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to start buying and selling?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students already using RECLAIM
          </p>
          {!user && (
            <Link
              href="/signup"
              className="inline-block bg-white text-blue-600 hover:bg-gray-50 px-10 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              Create Your Account
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
