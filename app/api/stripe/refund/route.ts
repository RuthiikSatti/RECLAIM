/**
 * Stripe Refund API Route
 *
 * TEMPORARILY DISABLED - Stripe integration on hold until business registration
 *
 * TODO: Enable after LLC setup and Stripe account activation
 *
 * This endpoint handles refund requests for orders.
 * To re-enable, uncomment the code at the bottom.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Disabled refund endpoint
 * Returns 503 Service Unavailable
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Refunds are currently disabled',
      message: 'Payment processing is not yet available. Refund functionality will be enabled once payments are active.'
    },
    { status: 503 }
  )
}

/*
 * ORIGINAL REFUND HANDLER CODE (DISABLED)
 *
 * Uncomment this entire section when ready to enable payments:
 *
 * import Stripe from 'stripe'
 * import { createClient } from '@/lib/supabase/server'
 *
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 *   apiVersion: '2025-10-29.clover'
 * })
 *
 * export async function POST(request: NextRequest) {
 *   try {
 *     const body = await request.json()
 *     const { orderId, reason } = body
 *
 *     if (!orderId) {
 *       return NextResponse.json(
 *         { error: 'Missing orderId' },
 *         { status: 400 }
 *       )
 *     }
 *
 *     // Get authenticated user
 *     const supabase = await createClient()
 *     const { data: { user }, error: authError } = await supabase.auth.getUser()
 *
 *     if (authError || !user) {
 *       return NextResponse.json(
 *         { error: 'Unauthorized' },
 *         { status: 401 }
 *       )
 *     }
 *
 *     // Fetch order and verify authorization
 *     // Create refund via Stripe
 *     // Update order status
 *     // Return success response
 *
 *     // See git history for full implementation
 *   } catch (error: any) {
 *     console.error('Error creating refund:', error)
 *     return NextResponse.json(
 *       { error: error.message || 'Internal server error' },
 *       { status: 500 }
 *     )
 *   }
 * }
 *
 * See git history for full implementation details.
 */
