import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import ChatBox from '@/components/chat/ChatBox'
import FloatingChatWidget from '@/components/chat/FloatingChatWidget'
import ReportButton from '@/components/listings/ReportButton'
import BuyButton from '@/components/listings/BuyButton'
import ViewListingTracker from '@/components/analytics/ViewListingTracker'
import ListingImages from '@/components/listings/ListingImages'
import { formatPrice, getTimeAgo } from '@/lib/utils/helpers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const currentUser = await getUser()

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !listing) {
    notFound()
  }

  // Fetch the seller/user data separately
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', listing.user_id)
    .single()

  // Add user to listing object
  listing.user = user

  const isOwner = currentUser?.id === listing.user_id

  return (
    <div className="min-h-screen bg-gray-50">
      <ViewListingTracker listingId={listing.id} title={listing.title} category={listing.category} />
      <div className="max-w-7xl mx-auto md:py-8">
        <div className="grid md:grid-cols-2 md:gap-8 md:px-4 lg:px-8">
          <div className="mb-6 md:mb-0">
            <ListingImages listingId={listing.id} altText={listing.title} />
          </div>

          <div className="space-y-6 px-4 md:px-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {listing.title}
              </h1>
              <p className="text-4xl font-bold text-blue-600 mb-4">
                {formatPrice(listing.price)}
              </p>
              <div className="flex gap-2 mb-4">
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-black">
                  {listing.category}
                </span>
                {listing.condition && (
                  <span className="bg-green-100 px-3 py-1 rounded-full text-sm text-green-800">
                    {listing.condition}
                  </span>
                )}
                <span className="text-black text-sm py-1">
                  Posted {getTimeAgo(listing.created_at)}
                </span>
              </div>
              <p className="text-black mb-6">{listing.description}</p>

              {listing.user && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-black mb-2">Seller</p>
                  <Link
                    href={'/profile/' + listing.user.id}
                    className="text-blue-600 hover:underline font-semibold text-lg block mb-1"
                  >
                    {listing.user.display_name}
                  </Link>
                  <p className="text-sm text-black">
                    @{listing.user.university_domain}
                  </p>
                </div>
              )}

              {/* Buy Button for non-owners */}
              {currentUser && !isOwner && (
                <div className="border-t pt-4 mt-4">
                  <BuyButton listing={listing} />
                  <div className="mt-4">
                    <ReportButton listingId={listing.id} />
                  </div>
                </div>
              )}

              {/* Edit Button for owners */}
              {isOwner && (
                <div className="border-t pt-4 mt-4">
                  <Link
                    href={`/edit/${listing.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Edit Listing
                  </Link>
                </div>
              )}

              {/* Guest users - show buy button with login redirect */}
              {!currentUser && (
                <div className="border-t pt-4 mt-4">
                  <BuyButton listing={listing} />
                </div>
              )}
            </div>

            {/* Optional: Keep the full chat box for desktop, or remove it entirely */}
            {currentUser && (
              <div className="hidden lg:block bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold mb-4 text-black">
                  {isOwner ? 'Messages from Buyers' : 'Contact Seller'}
                </h3>
                <ChatBox
                  listingId={listing.id}
                  sellerId={listing.user_id}
                  currentUserId={currentUser.id}
                  isOwner={isOwner}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat Widget - Only show for non-owners when logged in */}
      {currentUser && !isOwner && (
        <FloatingChatWidget
          listingId={listing.id}
          sellerId={listing.user_id}
          sellerName={listing.user?.display_name || 'Seller'}
          listingTitle={listing.title}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  )
}
