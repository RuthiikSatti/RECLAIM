import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import ReportButton from '@/components/listings/ReportButton'
import ContactSellerButton from '@/components/listings/ContactSellerButton'
import ViewListingTracker from '@/components/analytics/ViewListingTracker'
import ListingImages from '@/components/listings/ListingImages'
import CartToggleButton from '@/components/listings/CartToggleButton'
import DeleteListingButton from '@/components/listings/DeleteListingButton'
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
  const { user: currentUser, error: authError } = await getUser()

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
    <div className="min-h-screen bg-ume-bg">
      <ViewListingTracker listingId={listing.id} title={listing.title} category={listing.category} />
      <div className="max-w-7xl mx-auto py-6 md:py-8">
        <div className="grid md:grid-cols-2 md:gap-8 px-4 lg:px-8">
          <div className="mb-4 md:mb-0">
            <ListingImages listingId={listing.id} altText={listing.title} condition={listing.condition} />
          </div>

          <div className="space-y-4 md:px-0">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-ume-indigo mb-3">
                {listing.title}
              </h1>

              {/* Category and Condition badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                  {listing.category}
                </span>
                {listing.condition && (
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                    {listing.condition}
                  </span>
                )}
                <span className="text-gray-500 text-sm py-1">
                  Posted {getTimeAgo(listing.created_at)}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-4">{listing.description}</p>

              {/* Price - after description */}
              <p className="text-3xl font-bold text-ume-indigo mb-4">
                {formatPrice(listing.price)}
              </p>

              {/* Seller info */}
              {listing.user && (
                <div className="border-t pt-4 mt-4">
                  <Link
                    href={'/profile/' + listing.user.id}
                    className="text-black hover:text-ume-pink font-semibold text-lg block mb-1 transition-colors"
                  >
                    @{listing.user.username || listing.user.display_name}
                  </Link>
                  {listing.user.college_name && (
                    <p className="text-sm text-gray-600">
                      {listing.user.college_name}
                    </p>
                  )}
                </div>
              )}

              {/* Cart, Contact and Report for non-owners */}
              {currentUser && !isOwner && (
                <div className="border-t pt-4 mt-4 space-y-3">
                  <CartToggleButton
                    listingId={listing.id}
                    listingOwnerId={listing.user_id}
                    currentUserId={currentUser.id}
                  />
                  <ContactSellerButton listing={listing} />
                  <div className="mt-4">
                    <ReportButton listingId={listing.id} />
                  </div>
                </div>
              )}

              {/* Edit and Delete Buttons for owners */}
              {isOwner && (
                <div className="border-t pt-4 mt-4 flex gap-3">
                  <Link
                    href={`/edit/${listing.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-ume-indigo hover:bg-indigo-800 transition-colors"
                  >
                    Edit Listing
                  </Link>
                  <DeleteListingButton listingId={listing.id} />
                </div>
              )}

              {/* Guest users - show cart toggle */}
              {!currentUser && (
                <div className="border-t pt-4 mt-4 space-y-3">
                  <CartToggleButton listingId={listing.id} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
