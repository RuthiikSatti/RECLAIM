'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reportListing(listingId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      listing_id: listingId,
      reason,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Send email notification to support team (non-blocking - don't fail if email fails)
  try {
    console.log('[REPORT] Sending email notification for listing:', listingId)
    console.log('[REPORT] SUPPORT_EMAIL env:', process.env.SUPPORT_EMAIL)

    const { sendReportNotification } = await import('@/lib/email/sendEmail')
    const emailResult = await sendReportNotification({
      listingId,
      reportReason: reason,
      reporterId: user.id,
      timestamp: new Date().toISOString(),
    })

    console.log('[REPORT] Email result:', JSON.stringify(emailResult))
  } catch (emailError) {
    console.error('[REPORT] Failed to send notification email:', emailError)
    // Continue - don't fail the report submission if email fails
  }

  return { report: data }
}

export async function getAllReports() {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:users!reports_reporter_id_fkey(*), listing:listings(*)')
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { reports: data }
}

export async function updateReportStatus(reportId: string, status: 'resolved' | 'dismissed') {
  // Verify the caller is an admin
  const userSupabase = await createClient()
  const { data: { user } } = await userSupabase.auth.getUser()

  if (!user) {
    console.error('[ADMIN] updateReportStatus: No user session')
    return { error: 'Unauthorized: Not logged in', success: false }
  }

  // Check admin status
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  const serviceSupabase = await createServiceClient()

  const { data: userData } = await serviceSupabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!userData?.email || !adminEmails.includes(userData.email.toLowerCase())) {
    console.error('[ADMIN] updateReportStatus: User is not admin:', userData?.email)
    return { error: 'Unauthorized: Admin access required', success: false }
  }

  // Update the report status
  const { data, error } = await serviceSupabase
    .from('reports')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', reportId)
    .select()
    .single()

  if (error) {
    console.error('[ADMIN] updateReportStatus error:', error.message)
    return { error: error.message, success: false }
  }

  console.log('[ADMIN] Report status updated:', { reportId, status, updatedBy: userData.email })

  revalidatePath('/admin')
  return { success: true, status: data.status }
}
