import Link from 'next/link'
import { getUser } from '@/lib/auth/actions'

export default async function Home() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">Reclaim</h1>
            </div>
            <div className="flex gap-4">
              {user ? (
                <>
                  <Link
                    href="/marketplace"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2"
                  >
                    Marketplace
                  </Link>
                  <Link
                    href={`/profile/${user.id}`}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Campus Marketplace
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Buy and sell items safely within your university community.
            Verified .edu students only.
          </p>
          {!user && (
            <div className="flex gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-medium text-lg"
              >
                Sign up now
              </Link>
              <Link
                href="/login"
                className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium text-lg border-2 border-blue-600"
              >
                Sign in
              </Link>
            </div>
          )}
          {user && (
            <Link
              href="/marketplace"
              className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-medium text-lg"
            >
              Browse Marketplace
            </Link>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Verified Students Only</h3>
            <p className="text-gray-600">
              .edu email verification ensures you're trading within your campus community
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
            <p className="text-gray-600">
              Message sellers instantly and arrange pickups easily
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Safe & Simple</h3>
            <p className="text-gray-600">
              Report inappropriate listings and trade with confidence
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
