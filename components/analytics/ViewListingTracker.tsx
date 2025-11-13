'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/mixpanel/client'

export default function ViewListingTracker({ listingId, title, category }: { 
  listingId: string
  title: string
  category: string
}) {
  useEffect(() => {
    trackEvent('view_listing', {
      listing_id: listingId,
      title,
      category,
    })
  }, [listingId, title, category])

  return null
}
