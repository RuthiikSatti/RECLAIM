// app/create/actions.ts
'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server' // server scoped client factory
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const title = (formData.get('title') as string) || ''
  const description = (formData.get('description') as string) || ''
  const category = (formData.get('category') as string) || 'Other'
  const priceRaw = (formData.get('price') as string) || '0'
  const priceNumber = Number(priceRaw)
  const price_cents = Math.round(priceNumber * 100)
  const imageUrlsRaw = (formData.get('imageUrls') as string) || '[]'
  const imageUrls: string[] = imageUrlsRaw ? JSON.parse(imageUrlsRaw) : []

  const university_domain = extractDomain(user.email) ?? 'unknown'

  // Upsert user profile
  const { error: upsertErr } = await supabaseAdmin
    .from('users')
    .upsert({
      id: user.id,
      email: user.email ?? null,
      display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      university_domain,
    })

  if (upsertErr) {
    throw new Error(`Profile upsert failed: ${upsertErr.message}`)
  }

  // Insert listing (price stored in cents in `price` column)
  const { error: insertErr } = await supabaseAdmin
    .from('listings')
    .insert([
      {
        user_id: user.id,
        title,
        description,
        category,
        price: price_cents,
        image_urls: imageUrls,
        created_at: new Date().toISOString(),
      },
    ])

  if (insertErr) {
    throw new Error(`Create listing failed: ${insertErr.message}`)
  }

  revalidatePath('/marketplace')
  redirect('/marketplace')
}
