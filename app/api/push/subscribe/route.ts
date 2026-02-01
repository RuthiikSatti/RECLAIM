/**
 * API Route: Save Push Subscription
 * POST /api/push/subscribe
 *
 * Saves a Web Push subscription for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveSubscription } from '@/lib/push/subscriptionManager'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse subscription from request body
    const body = await request.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    // Get user agent for device identification
    const userAgent = request.headers.get('user-agent') || undefined

    // Save subscription
    const result = await saveSubscription(user.id, subscription, userAgent)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error saving push subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
