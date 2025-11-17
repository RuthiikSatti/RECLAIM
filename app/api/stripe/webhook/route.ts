/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events to update order status.
 *
 * Events handled:
 * - checkout.session.completed: Update order to 'paid'
 * - payment_intent.succeeded: Confirm payment success
 * - charge.refunded: Update order to 'refunded'
 *
 * Setup:
 * 1. Go to Stripe Dashboard > Developers > Webhooks
 * 2. Add endpoint: https://yourdomain.com/api/stripe/webhook
 * 3. Select events: checkout.session.completed, payment_intent.succeeded, charge.refunded
 * 4. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET in .env.local
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { sendBuyerConfirmation, sendSellerNotification } from '@/lib/email/sendEmail'
import { notifyBuyerPaymentSuccess, notifySellerItemSold } from '@/lib/notifications/createNotification'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabase = await createServiceClient()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('Checkout session completed:', session.id)

        // Update order status to 'paid'
        const { data: order, error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string,
            payment_method: session.payment_method_types?.[0] || 'card',
          })
          .eq('stripe_checkout_session_id', session.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating order:', updateError)

          // If order doesn't exist, create it from session metadata
          if (updateError.code === 'PGRST116') {
            const metadata = session.metadata
            if (metadata) {
              const { error: createError } = await supabase
                .from('orders')
                .insert({
                  buyer_id: metadata.buyerId,
                  seller_id: metadata.sellerId,
                  listing_id: metadata.listingId,
                  stripe_checkout_session_id: session.id,
                  stripe_payment_intent_id: session.payment_intent as string,
                  amount_cents: session.amount_total || 0,
                  currency: session.currency || 'usd',
                  platform_fee_cents: parseInt(metadata.platformFeeCents || '0'),
                  seller_amount_cents: parseInt(metadata.sellerAmountCents || '0'),
                  status: 'paid',
                  buyer_email: session.customer_details?.email || metadata.buyerEmail,
                  buyer_name: session.customer_details?.name || metadata.buyerName,
                  payment_method: session.payment_method_types?.[0] || 'card',
                  buyer_shipping_address: (session as any).shipping_details?.address || session.customer_details?.address,
                })

              if (createError) {
                console.error('Error creating order from webhook:', createError)
              }
            }
          }
        } else {
          console.log('Order updated successfully:', order.id)

          // Send notifications and emails on successful payment
          await sendPaymentNotifications(supabase, order)
        }

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        console.log('Payment intent succeeded:', paymentIntent.id)

        // Update order with payment intent details
        await supabase
          .from('orders')
          .update({
            stripe_payment_intent_id: paymentIntent.id,
            stripe_charge_id: paymentIntent.latest_charge as string,
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        console.log('Charge refunded:', charge.id)

        // Update order status to 'refunded'
        const { data: order, error: refundError } = await supabase
          .from('orders')
          .update({
            status: 'refunded',
            stripe_refund_id: charge.refunds?.data?.[0]?.id || null,
            refunded_at: new Date().toISOString(),
          })
          .eq('stripe_charge_id', charge.id)
          .select()
          .single()

        if (refundError) {
          console.error('Error updating refunded order:', refundError)
        } else {
          console.log('Order refunded successfully:', order.id)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Return success response
    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Disable body parsing for webhook to work properly
export const dynamic = 'force-dynamic'

/**
 * Send payment success notifications to buyer and seller
 */
async function sendPaymentNotifications(supabase: any, order: any) {
  try {
    // Fetch listing details
    const { data: listing } = await supabase
      .from('listings')
      .select('title, price')
      .eq('id', order.listing_id)
      .single()

    // Fetch buyer details
    const { data: buyer } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', order.buyer_id)
      .single()

    // Fetch seller details
    const { data: seller } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', order.seller_id)
      .single()

    if (!listing || !buyer || !seller) {
      console.error('Missing data for notifications:', { listing, buyer, seller })
      return
    }

    // 1. Send buyer confirmation email
    await sendBuyerConfirmation({
      buyerEmail: buyer.email,
      buyerName: buyer.display_name || order.buyer_name || 'Customer',
      orderId: order.id,
      listingTitle: listing.title,
      listingPrice: order.amount_cents,
      sellerName: seller.display_name || 'Seller',
      sellerEmail: seller.email,
      orderDate: order.created_at,
    })

    // 2. Send seller notification email
    await sendSellerNotification({
      sellerEmail: seller.email,
      sellerName: seller.display_name || 'Seller',
      orderId: order.id,
      listingTitle: listing.title,
      listingPrice: order.amount_cents,
      buyerName: buyer.display_name || order.buyer_name || 'Customer',
      buyerEmail: buyer.email,
      buyerShippingAddress: order.buyer_shipping_address,
      orderDate: order.created_at,
    })

    // 3. Create in-app notification for buyer
    await notifyBuyerPaymentSuccess({
      buyerId: order.buyer_id,
      orderId: order.id,
      listingId: order.listing_id,
      listingTitle: listing.title,
      amount: order.amount_cents,
    })

    // 4. Create in-app notification for seller
    await notifySellerItemSold({
      sellerId: order.seller_id,
      orderId: order.id,
      listingId: order.listing_id,
      listingTitle: listing.title,
      amount: order.amount_cents,
      buyerName: buyer.display_name || order.buyer_name || 'Customer',
    })

    console.log('All payment notifications sent successfully for order:', order.id)
  } catch (error) {
    console.error('Error sending payment notifications:', error)
    // Don't throw - we don't want to fail the webhook if notifications fail
  }
}
