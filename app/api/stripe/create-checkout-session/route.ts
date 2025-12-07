/**
 * Stripe Checkout Session API Route
 *
 * TEMPORARILY DISABLED - Stripe integration on hold until business registration
 *
 * TODO: Enable after LLC setup and Stripe account activation
 *
 * Original Flow (when re-enabled):
 * 1. Buyer clicks "Buy Now" on a listing
 * 2. Frontend calls this endpoint with listingId
 * 3. Server creates Stripe Checkout Session
 * 4. Server creates pending order in database
 * 5. Returns checkout URL to redirect buyer
 * 6. Buyer completes payment on Stripe
 * 7. Webhook updates order status to 'paid'
 */

import { NextRequest, NextResponse } from 'next/server'
// import Stripe from 'stripe' // DISABLED - Uncomment when ready
// import { createClient } from '@/lib/supabase/server' // DISABLED

export const runtime = 'nodejs'

// DISABLED - Stripe initialization
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-10-29.clover'
// })

// Platform fee percentage (e.g., 10% = 0.10)
// const PLATFORM_FEE_PERCENTAGE = 0.10

export async function POST(request: NextRequest) {
  // DISABLED - Payments not available
  return NextResponse.json(
    {
      error: 'Payments are currently disabled',
      message: 'Payment processing is not yet available. We are finalizing business registration and payment setup. Please check back soon!'
    },
    { status: 503 } // Service Unavailable
  )

  /* DISABLED - Original payment flow
  try {
    // Check if payments are enabled
    const paymentsEnabled = process.env.FEATURE_PAYMENTS_ENABLED === 'true'
    if (!paymentsEnabled) {
      return NextResponse.json(
        {
          error: 'Payments are currently disabled',
          message: 'Payment processing is not yet available. Please check back later or contact support.'
        },
        { status: 503 } // Service Unavailable
      )
    }

    const body = await request.json()
    const { listingId } = body

    if (!listingId) {
      return NextResponse.json(
        { error: 'Missing listingId' },
        { status: 400 }
      )
    }

    // Get authenticated user (buyer)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const buyerId = user.id

    // Fetch listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*, user:users(*)')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Prevent buying your own listing
    if (listing.user_id === buyerId) {
      return NextResponse.json(
        { error: 'Cannot purchase your own listing' },
        { status: 400 }
      )
    }

    // Calculate amounts (price is already in cents in database)
    const amountCents = listing.price // Price is stored in cents
    const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENTAGE)
    const sellerAmountCents = amountCents - platformFeeCents

    // Get buyer details
    const { data: buyer } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', buyerId)
      .single()

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.title,
              description: listing.description?.substring(0, 500) || 'RECLAIM marketplace item',
              images: listing.image_urls?.slice(0, 1) || [], // Stripe allows max 8 images
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      customer_email: buyer?.email || user.email,
      metadata: {
        listingId: listing.id,
        buyerId: buyerId,
        sellerId: listing.user_id,
        platformFeeCents: platformFeeCents.toString(),
        sellerAmountCents: sellerAmountCents.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/item/${listingId}?cancelled=true`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    })

    // Create pending order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: buyerId,
        seller_id: listing.user_id,
        listing_id: listing.id,
        stripe_checkout_session_id: session.id,
        amount_cents: amountCents,
        currency: 'usd',
        platform_fee_cents: platformFeeCents,
        seller_amount_cents: sellerAmountCents,
        status: 'pending',
        buyer_email: buyer?.email || user.email,
        buyer_name: buyer?.display_name || 'Anonymous',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      // Still return session URL - webhook will handle order creation if needed
    }

    // Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      orderId: order?.id
    })

  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
  */
}
