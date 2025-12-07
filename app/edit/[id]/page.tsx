import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import { notFound, redirect } from 'next/navigation'
import EditListingForm from '@/components/listings/EditListingForm'

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const currentUser = await getUser()

  if (!currentUser) {
    redirect('/login')
  }

  // Fetch the listing
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !listing) {
    notFound()
  }

  // Verify ownership
  if (listing.user_id !== currentUser.id) {
    redirect('/marketplace')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">Edit Listing</h1>
        <EditListingForm listing={listing} />
      </div>
    </div>
  )
}
