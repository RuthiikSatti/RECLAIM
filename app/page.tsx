import Link from 'next/link'
import { getUser } from '@/lib/auth/actions'

export default async function Home() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Three-column grid layout: left | center | right */}
          <div className="grid h-[55px] items-center grid-cols-[1fr_auto_1fr]">
            {/* Left slot */}
            <div className="flex flex-1 justify-start shrink-0 max-w-[30%] min-w-fit px-[11px]">
              {user && (
                <Link
                  href="/marketplace"
                  className="text-black hover:text-blue-600 px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  Marketplace
                </Link>
              )}
            </div>

            {/* Center slot */}
            <div className="flex flex-grow h-[55px] items-center justify-self-center overflow-hidden">
              <div className="w-full text-sm font-medium overflow-hidden whitespace-nowrap text-center text-ellipsis">
                <h1 className="text-2xl font-bold text-blue-600">Reclaim</h1>
              </div>
            </div>

            {/* Right slot */}
            <div className="flex shrink-0 max-w-[30%] min-w-fit px-[11px] justify-self-end">
              <div className="flex gap-4">
                {user ? (
                  <Link
                    href={`/profile/${user.id}`}
                    className="text-black hover:text-blue-600 px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Profile
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-black hover:text-blue-600 px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg whitespace-nowrap overflow-hidden text-ellipsis"
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

      {/* Transition Container */}
      <div className="relative h-full overflow-hidden">
        {/* Page Panel with Transition */}
        <div className="absolute left-0 top-0 w-full h-full opacity-100 flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]">
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-black mb-6">
            Your Campus Marketplace
          </h1>
          <p className="text-xl text-black mb-8 max-w-2xl mx-auto">
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
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-medium text-lg border-2 border-blue-600"
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
            <h3 className="text-xl font-semibold mb-2 text-black">Verified Students Only</h3>
            <p className="text-black">
              .edu email verification ensures you're trading within your campus community
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-black">Real-time Chat</h3>
            <p className="text-black">
              Message sellers instantly and arrange pickups easily
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-black">Safe & Simple</h3>
            <p className="text-black">
              Report inappropriate listings and trade with confidence
            </p>
          </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
