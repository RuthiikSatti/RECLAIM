/**
 * Stripe Webhook Handler
 *
 * TEMPORARILY DISABLED - Stripe integration on hold until business registration
 *
 * TODO: Enable after LLC setup and Stripe account activation
 *
 * This file contains the disabled Stripe webhook handler.
 * To re-enable, uncomment the code at the bottom and remove the disabled handler.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Disabled webhook endpoint
 * Returns 503 Service Unavailable
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Webhooks are currently disabled',
      message: 'Payment processing is not yet available. We are finalizing business registration and payment setup.'
    },
    { status: 503 }
  )
}

/*
 * ORIGINAL WEBHOOK HANDLER CODE (DISABLED)
 *
 * Uncomment this entire section when ready to enable payments:
 *
 * import Stripe from 'stripe'
 * import { createServiceClient } from '@/lib/supabase/server'
 * import { sendBuyerConfirmation, sendSellerNotification } from '@/lib/email/sendEmail'
 * import { notifyBuyerPaymentSuccess, notifySellerItemSold } from '@/lib/notifications/createNotification'
 *
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 *   apiVersion: '2025-10-29.clover'
 * })
 *
 * const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
 *
 * export async function POST(request: NextRequest) {
 *   try {
 *     const body = await request.text()
 *     const signature = request.headers.get('stripe-signature')
 *
 *     if (!signature) {
 *       return NextResponse.json(
 *         { error: 'Missing stripe-signature header' },
 *         { status: 400 }
 *       )
 *     }
 *
 *     // Verify webhook signature
 *     let event: Stripe.Event
 *     try {
 *       event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
 *     } catch (err: any) {
 *       console.error('Webhook signature verification failed:', err.message)
 *       return NextResponse.json(
 *         { error: 'Webhook signature verification failed' },
 *         { status: 400 }
 *       )
 *     }
 *
 *     // Create Supabase client
 *     const supabase = await createServiceClient()
 *
 *     // Handle different event types
 *     switch (event.type) {
 *       case 'checkout.session.completed': {
 *         // Handle successful checkout
 *         // Update order status, send notifications, etc.
 *         break
 *       }
 *
 *       case 'payment_intent.succeeded': {
 *         // Handle successful payment
 *         break
 *       }
 *
 *       case 'charge.refunded': {
 *         // Handle refund
 *         break
 *       }
 *     }
 *
 *     return NextResponse.json({ received: true })
 *   } catch (error: any) {
 *     console.error('Webhook error:', error)
 *     return NextResponse.json(
 *       { error: error.message || 'Webhook handler failed' },
 *       { status: 500 }
 *     )
 *   }
 * }
 *
 * See git history for full implementation details.
 */
