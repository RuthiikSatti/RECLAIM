/**
 * Order Shipping API Route
 *
 * Allows sellers to update shipping information for their orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyBuyerOrderShipped } from '@/lib/notifications/createNotification'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()
    const { tracking_number, shipping_carrier } = body

    if (!tracking_number || !shipping_carrier) {
      return NextResponse.json(
        { error: 'Missing tracking_number or shipping_carrier' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch order to verify seller
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, listing:listings(title)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify user is the seller
    if (order.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the seller of this order' },
        { status: 403 }
      )
    }

    // Update order with shipping info
    const serviceSupabase = await createServiceClient()
    const { error: updateError } = await serviceSupabase
      .from('orders')
      .update({
        tracking_number,
        shipping_carrier,
        shipped_at: new Date().toISOString(),
        status: 'processing' // Update status to processing
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order shipping:', updateError)
      return NextResponse.json(
        { error: 'Failed to update shipping information' },
        { status: 500 }
      )
    }

    // Notify buyer that order has shipped
    await notifyBuyerOrderShipped({
      buyerId: order.buyer_id,
      orderId: order.id,
      listingId: order.listing_id,
      listingTitle: order.listing?.title || 'Item',
      trackingNumber: tracking_number
    })

    return NextResponse.json({
      success: true,
      message: 'Shipping information updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating shipping:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mark order as delivered
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const { id: orderId } = await params

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify user is buyer or seller
    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update order as delivered
    const serviceSupabase = await createServiceClient()
    const { error: updateError } = await serviceSupabase
      .from('orders')
      .update({
        delivered_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error marking order as delivered:', updateError)
      return NextResponse.json(
        { error: 'Failed to mark order as delivered' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order marked as delivered'
    })

  } catch (error: any) {
    console.error('Error marking as delivered:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
