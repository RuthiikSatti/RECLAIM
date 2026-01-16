/**
 * Admin API endpoint to update report status
 *
 * PATCH /api/admin/reports/[id]
 * Body: { status: "resolved" | "dismissed" }
 *
 * Security:
 * - Requires authenticated user
 * - User must be in ADMIN_EMAILS list
 * - In test mode (ADMIN_TEST_MODE=true), accepts ADMIN_TEST_TOKEN header
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Verify admin access
 * Returns user info if admin, null otherwise
 */
async function verifyAdminAccess(request: Request): Promise<{ userId: string; email: string } | null> {
  // Test mode bypass (only in non-production)
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.ADMIN_TEST_MODE === 'true'
  ) {
    const testToken = request.headers.get('X-Admin-Test-Token')
    if (testToken === process.env.ADMIN_TEST_TOKEN) {
      return { userId: 'test-admin', email: 'test-admin@example.com' }
    }
  }

  // Normal auth flow
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Check if user is admin
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  const serviceSupabase = await createServiceClient()

  const { data: userData } = await serviceSupabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!userData?.email || !adminEmails.includes(userData.email.toLowerCase())) {
    return null
  }

  return { userId: user.id, email: userData.email }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params

  // Verify admin access
  const admin = await verifyAdminAccess(request)
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin access required', success: false },
      { status: 403 }
    )
  }

  // Parse request body
  let body: { status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', success: false },
      { status: 400 }
    )
  }

  // Validate status
  const { status } = body
  if (!status || !['resolved', 'dismissed'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status. Must be "resolved" or "dismissed"', success: false },
      { status: 400 }
    )
  }

  // Update report
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('reports')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', reportId)
    .select()
    .single()

  if (error) {
    console.error('[ADMIN API] Update report error:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Report not found', success: false },
      { status: 404 }
    )
  }

  console.log('[ADMIN API] Report updated:', { reportId, status, updatedBy: admin.email })

  return NextResponse.json({
    success: true,
    status: data.status,
    reportId: data.id,
    updatedAt: data.updated_at,
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params

  // Verify admin access
  const admin = await verifyAdminAccess(request)
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin access required', success: false },
      { status: 403 }
    )
  }

  // Get report
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:users!reports_reporter_id_fkey(*), listing:listings(*)')
    .eq('id', reportId)
    .single()

  if (error) {
    console.error('[ADMIN API] Get report error:', error)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Report not found', success: false },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, report: data })
}
