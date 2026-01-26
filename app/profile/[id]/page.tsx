import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import ListingCard from '@/components/listings/ListingCard'
import DeleteListingButton from '@/components/listings/DeleteListingButton'
import ProfileSettings from '@/components/profile/ProfileSettings'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { user: currentUser, error: authError } = await getUser()

  const { data: profileUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (userError || !profileUser) {
    notFound()
  }

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const isOwnProfile = currentUser?.id === id

  return (
    <div className="min-h-screen bg-ume-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-ume-indigo mb-2">
            {profileUser.username || profileUser.display_name}
          </h1>
          <p className="text-black">@{profileUser.university_domain}</p>
          <p className="text-sm text-black mt-2">
            Member since {new Date(profileUser.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Profile Settings - Only show for own profile */}
        {isOwnProfile && (
          <ProfileSettings
            currentDisplayName={profileUser.username || profileUser.display_name}
            userId={id}
            currentCollegeName={profileUser.college_name}
            currentCollegeAddress={profileUser.college_address}
          />
        )}

        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-ume-indigo">
            {isOwnProfile ? 'Your Listings' : 'Listings'}
          </h2>
        </div>

        {listings && listings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-black text-lg">No listings yet</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings?.map((listing) => (
            <div key={listing.id} className="relative">
              <ListingCard listing={{ ...listing, user: profileUser }} />
              {isOwnProfile && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <Link
                    href={`/edit/${listing.id}`}
                    className="bg-ume-indigo text-white px-3 py-1 rounded-full text-sm hover:bg-indigo-800"
                  >
                    Edit
                  </Link>
                  <DeleteListingButton listingId={listing.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
