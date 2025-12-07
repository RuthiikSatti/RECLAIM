'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export interface CartItem {
  id: string
  user_id: string
  listing_id: string
  quantity: number
  created_at: string
  updated_at: string
  listing?: {
    id: string
    title: string
    price: number
    image_urls: string[]
    user_id: string
  }
}

/**
 * Add item to cart
 */
export async function addToCart(listingId: string, quantity: number = 1) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Must be logged in to add to cart' }
    }

    const supabase = await createClient()

    // Check if item already in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .maybeSingle()

    if (existing) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating cart item:', error)
        return { error: 'Failed to update cart' }
      }
    } else {
      // Insert new cart item
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          listing_id: listingId,
          quantity
        })

      if (error) {
        console.error('Error adding to cart:', error)
        return { error: 'Failed to add to cart' }
      }
    }

    revalidatePath('/cart')
    return { success: true }
  } catch (error) {
    console.error('Error in addToCart:', error)
    return { error: 'Failed to add to cart' }
  }
}

/**
 * Get all cart items for current user
 */
export async function getCartItems(): Promise<{ items?: CartItem[]; error?: string }> {
  try {
    const user = await getUser()
    if (!user) {
      return { items: [] }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cart_items')
      .select('*, listing:listings(id, title, price, image_urls, user_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cart items:', error)
      return { error: 'Failed to load cart' }
    }

    return { items: (data as CartItem[]) || [] }
  } catch (error) {
    console.error('Error in getCartItems:', error)
    return { error: 'Failed to load cart' }
  }
}

/**
 * Get cart count for current user
 */
export async function getCartCount(): Promise<number> {
  try {
    const user = await getUser()
    if (!user) {
      return 0
    }

    const supabase = await createClient()

    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error getting cart count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getCartCount:', error)
    return 0
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Must be logged in' }
    }

    if (quantity < 1) {
      return { error: 'Quantity must be at least 1' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating quantity:', error)
      return { error: 'Failed to update quantity' }
    }

    revalidatePath('/cart')
    return { success: true }
  } catch (error) {
    console.error('Error in updateCartItemQuantity:', error)
    return { error: 'Failed to update quantity' }
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(cartItemId: string) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Must be logged in' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error removing from cart:', error)
      return { error: 'Failed to remove from cart' }
    }

    revalidatePath('/cart')
    return { success: true }
  } catch (error) {
    console.error('Error in removeFromCart:', error)
    return { error: 'Failed to remove from cart' }
  }
}

/**
 * Clear entire cart
 */
export async function clearCart() {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Must be logged in' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error clearing cart:', error)
      return { error: 'Failed to clear cart' }
    }

    revalidatePath('/cart')
    return { success: true }
  } catch (error) {
    console.error('Error in clearCart:', error)
    return { error: 'Failed to clear cart' }
  }
}
