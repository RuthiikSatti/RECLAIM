'use client'
import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'reclaim_cart'

// Custom event for cross-component cart updates
const CART_UPDATED_EVENT = 'cart-updated'

// Dispatch custom event to notify all useCart instances
function broadcastCartUpdate() {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT))
}

// Read cart IDs from localStorage (extracting just the listing_id from stored objects)
function readCartFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)

    // Handle both formats: array of IDs or array of objects with listing_id
    if (Array.isArray(parsed)) {
      return parsed.map(item => {
        if (typeof item === 'string') return item
        if (item.listing_id) return item.listing_id
        if (item.id) return item.id
        return null
      }).filter(Boolean) as string[]
    }

    return []
  } catch (e) {
    console.error('Failed to read cart from localStorage', e)
    return []
  }
}

// Write cart to localStorage (maintaining object format for cart page compatibility)
function writeCartToStorage(listingIds: string[]) {
  try {
    // Convert IDs to objects for cart page compatibility
    const cartObjects = listingIds.map(id => ({
      id: `local-${id}-${Date.now()}`,
      listing_id: id,
      quantity: 1
    }))

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartObjects))
    console.debug('useCart: wrote to storage', listingIds)
  } catch (e) {
    console.error('Failed to write cart to localStorage', e)
  }
}

export default function useCart() {
  const [cart, setCart] = useState<string[]>([])
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})

  // Initialize cart from localStorage
  useEffect(() => {
    const initialCart = readCartFromStorage()
    setCart(initialCart)
    console.debug('useCart: initialized with', initialCart)
  }, [])

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const newCart = readCartFromStorage()
        setCart(newCart)
        console.debug('useCart: storage event from other tab', newCart)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Listen for custom cart update events from same tab
  useEffect(() => {
    const handleCartUpdate = () => {
      const newCart = readCartFromStorage()
      setCart(newCart)
      console.debug('useCart: custom event update', newCart)
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate)
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate)
  }, [])

  const isInCart = useCallback((id: string) => {
    const inCart = cart.includes(id)
    console.debug(`useCart.isInCart(${id}):`, inCart)
    return inCart
  }, [cart])

  const addToCart = useCallback(async (id: string) => {
    console.debug(`useCart.addToCart: starting for ${id}`)

    // Check current state from storage to prevent race conditions
    const currentCart = readCartFromStorage()
    if (currentCart.includes(id)) {
      console.debug(`useCart.addToCart: ${id} already in cart, skipping`)
      return
    }

    setLoadingIds(prev => ({ ...prev, [id]: true }))

    try {
      const newCart = [...currentCart, id]
      writeCartToStorage(newCart)
      setCart(newCart)
      broadcastCartUpdate()
      console.debug(`useCart.addToCart: added ${id}`, newCart)
    } catch (e) {
      console.error('Failed to add to cart', e)
    } finally {
      setLoadingIds(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
    }
  }, [])

  const removeFromCart = useCallback(async (id: string) => {
    console.debug(`useCart.removeFromCart: starting for ${id}`)

    // Check current state from storage
    const currentCart = readCartFromStorage()
    if (!currentCart.includes(id)) {
      console.debug(`useCart.removeFromCart: ${id} not in cart, skipping`)
      return
    }

    setLoadingIds(prev => ({ ...prev, [id]: true }))

    try {
      const newCart = currentCart.filter(x => x !== id)
      writeCartToStorage(newCart)
      setCart(newCart)
      broadcastCartUpdate()
      console.debug(`useCart.removeFromCart: removed ${id}`, newCart)
    } catch (e) {
      console.error('Failed to remove from cart', e)
    } finally {
      setLoadingIds(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
    }
  }, [])

  return { cart, isInCart, addToCart, removeFromCart, loadingIds }
}
