'use client'

import useCart from '@/hooks/useCart'

interface CartToggleButtonProps {
  listingId: string
  listingOwnerId?: string
  currentUserId?: string
}

export default function CartToggleButton({ listingId, listingOwnerId, currentUserId }: CartToggleButtonProps) {
  const { isInCart, addToCart, removeFromCart, loadingIds } = useCart()
  const inCart = isInCart(listingId)
  const loading = loadingIds[listingId] === true

  // Don't show button if this is your own listing
  if (listingOwnerId && currentUserId && listingOwnerId === currentUserId) {
    return null
  }

  return (
    <button
      onClick={() => {
        if (inCart) removeFromCart(listingId)
        else addToCart(listingId)
      }}
      disabled={loading}
      aria-pressed={inCart}
      className={`w-full px-6 py-3 rounded-full text-base font-medium transition-colors ${
        inCart ? 'bg-white border-2 border-ume-indigo text-ume-indigo hover:bg-gray-50' : 'bg-ume-indigo text-white hover:bg-indigo-800'
      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {loading ? 'Working...' : (inCart ? 'Remove from cart' : 'Add to cart')}
    </button>
  )
}
