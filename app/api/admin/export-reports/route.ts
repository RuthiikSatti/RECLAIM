/**
 * Admin CSV Export API Route
 *
 * Exports all reports as CSV for admin review
 * Only accessible to admin users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())

  if (adminEmails.length === 0) {
    return false
  }

  const supabase = await createServiceClient()
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  return user ? adminEmails.includes(user.email) : false
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all reports using service client to bypass RLS
    const serviceSupabase = await createServiceClient()
    const { data: reports, error: reportsError } = await serviceSupabase
      .from('reports')
      .select(`
        *,
        reporter:users!reporter_id(id, email, display_name),
        listing:listings(id, title, user_id)
      `)
      .order('created_at', { ascending: false })

    if (reportsError) {
      console.error('Error fetching reports:', reportsError)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    // Convert to CSV
    const csvRows = []

    // Header row
    csvRows.push([
      'Report ID',
      'Created At',
      'Status',
      'Reason',
      'Description',
      'Reporter ID',
      'Reporter Email',
      'Reporter Name',
      'Listing ID',
      'Listing Title',
      'Listing Owner ID',
      'Resolved At',
      'Resolution Notes'
    ].join(','))

    // Data rows
    for (const report of reports || []) {
      csvRows.push([
        `"${report.id}"`,
        `"${report.created_at}"`,
        `"${report.status}"`,
        `"${report.reason}"`,
        `"${(report.description || '').replace(/"/g, '""')}"`, // Escape quotes
        `"${report.reporter_id}"`,
        `"${report.reporter?.email || 'N/A'}"`,
        `"${report.reporter?.display_name || 'N/A'}"`,
        `"${report.listing_id}"`,
        `"${report.listing?.title || 'N/A'}"`,
        `"${report.listing?.user_id || 'N/A'}"`,
        `"${report.resolved_at || ''}"`,
        `"${(report.resolution_notes || '').replace(/"/g, '""')}"`
      ].join(','))
    }

    const csv = csvRows.join('\n')

    // Return CSV with appropriate headers
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="reclaim-reports-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error: any) {
    console.error('Error exporting reports:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
