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
  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', reportId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}
