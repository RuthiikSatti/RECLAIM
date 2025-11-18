// app/create/actions.ts
'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server' // server scoped client factory
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Check if environment variables are set
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing environment variables:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SERVICE_ROLE_KEY: !!SERVICE_ROLE_KEY
  })
}

const supabaseAdmin = createAdminClient(
  SUPABASE_URL!,
  SERVICE_ROLE_KEY!
)

function extractDomain(email?: string | null) {
  if (!email) return null
  const parts = email.split('@')
  return parts.length === 2 ? parts[1].toLowerCase() : null
}

/**
 * Server action to handle create listing form submission.
 * Use in page form: <form action={handleCreateListing}>...</form>
 */
export async function handleCreateListing(formData: FormData): Promise<void> {
  try {
    console.log('[CreateListing] Starting listing creation...')

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[CreateListing] No authenticated user')
      throw new Error('Unauthorized - Please log in first')
    }

    console.log('[CreateListing] User authenticated:', user.id)

    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    const category = (formData.get('category') as string) || 'Other'
    const condition = (formData.get('condition') as string) || 'Used'
    const priceRaw = (formData.get('price') as string) || '0'
    const priceNumber = Number(priceRaw)
    const price_cents = Math.round(priceNumber * 100)
    const imageUrlsRaw = (formData.get('imageUrls') as string) || '[]'

    console.log('[CreateListing] Form data:', {
      title,
      category,
      condition,
      price_cents,
      imageUrlsRaw: imageUrlsRaw.substring(0, 100)
    })

    let imageUrls: string[] = []
    try {
      imageUrls = imageUrlsRaw ? JSON.parse(imageUrlsRaw) : []
    } catch (e) {
      console.error('[CreateListing] Failed to parse imageUrls:', e)
      imageUrls = []
    }

    const university_domain = extractDomain(user.email) ?? 'unknown'

    // Upsert user profile
    console.log('[CreateListing] Upserting user profile...')
    const { error: upsertErr } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email ?? null,
        display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        university_domain,
      })

    if (upsertErr) {
      console.error('[CreateListing] Profile upsert error:', upsertErr)
      throw new Error(`Profile upsert failed: ${upsertErr.message}`)
    }

    console.log('[CreateListing] User profile upserted successfully')

    // Insert listing (price stored in cents in `price` column)
    console.log('[CreateListing] Inserting listing...')
    const { error: insertErr, data: insertedListing } = await supabaseAdmin
      .from('listings')
      .insert([
        {
          user_id: user.id,
          title,
          description,
          category,
          condition,
          price: price_cents,
          image_urls: imageUrls,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (insertErr) {
      console.error('[CreateListing] Insert error:', insertErr)
      throw new Error(`Create listing failed: ${insertErr.message}`)
    }

    console.log('[CreateListing] Listing created successfully:', insertedListing?.[0]?.id)
    console.log('[CreateListing] Revalidating marketplace...')

    revalidatePath('/marketplace')

    console.log('[CreateListing] Redirecting to marketplace...')
    redirect('/marketplace')

  } catch (error: any) {
    console.error('[CreateListing] Unexpected error:', error)
    // If it's already a redirect, just throw it
    if (error.message?.includes('NEXT_REDIRECT')) {
      throw error
    }
    // Otherwise, throw a user-friendly error
    throw new Error(`Failed to create listing: ${error.message}`)
  }
}
