/**
 * Cart API Route - MVP Stub Implementation
 *
 * This is a graceful stub that allows the cart UI to function without
 * requiring a backend database implementation. The client-side BuyButton
 * will fall back to localStorage when this API returns 501.
 *
 * TODO: Replace with Supabase-backed implementation
 * TODO: Add user authentication check (supabase.auth.getUser())
 * TODO: Implement cart_items table operations:
 *   - Schema: { id, user_id, listing_id, quantity, created_at }
 *   - Join with listings table for full item details
 * TODO: Add proper error handling and validation
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/cart
 * Returns cart items for the authenticated user
 *
 * TODO: Implement Supabase query:
 * const { data, error } = await supabase
 *   .from('cart_items')
 *   .select('*, listing:listings(*)')
 *   .eq('user_id', user.id)
 */
export async function GET(request: NextRequest) {
  try {
    // Graceful stub - returns empty cart
    return NextResponse.json({ items: [] }, { status: 200 })
  } catch (error: any) {
    console.error('Cart GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cart
 * Adds an item to the cart
 *
 * Expected body: { item: { listing_id, title, price, qty, ... } }
 *
 * Returns 501 (Not Implemented) to trigger localStorage fallback in client
 *
 * TODO: Implement Supabase insert:
 * const { data, error } = await supabase
 *   .from('cart_items')
 *   .insert({
 *     user_id: user.id,
 *     listing_id: item.listing_id,
 *     quantity: item.qty || 1
 *   })
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { item } = body

    if (!item || !item.listing_id) {
      return NextResponse.json(
        { error: 'Missing required fields: listing_id' },
        { status: 400 }
      )
    }

    // Return 501 to signal client to use localStorage fallback
    return NextResponse.json(
      { error: 'Cart server not implemented' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Cart POST error:', error)
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cart
 * Removes an item from the cart
 *
 * Expected body: { id: string }
 *
 * TODO: Implement Supabase delete:
 * const { error } = await supabase
 *   .from('cart_items')
 *   .delete()
 *   .eq('id', id)
 *   .eq('user_id', user.id) // Security: only delete own items
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    // Graceful stub - returns success
    return NextResponse.json(
      { success: true, message: 'Item removed from cart' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to remove from cart' },
      { status: 500 }
    )
  }
}
