import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import ListingCard from '@/components/listings/ListingCard'
import SearchFilter from '@/components/listings/SearchFilter'
import type { Listing } from '@/types/database'

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('*, user:users(*)')
    .order('created_at', { ascending: false })

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  if (params.category && params.category !== 'All') {
    query = query.eq('category', params.category)
  }

  const { data: listings, error } = await query

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-4">Marketplace</h1>
          <SearchFilter />
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <p className="text-red-800">Error loading listings. Please try again.</p>
          </div>
        )}

        {listings && listings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-black text-lg">No listings found.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings?.map((listing) => (
            <ListingCard key={listing.id} listing={listing as Listing} />
          ))}
        </div>
      </div>
    </div>
  )
}
