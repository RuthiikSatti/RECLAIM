// app/create/actions.ts (or wherever your actions live)
'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server' // your server-scoped client factory
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Create an admin client using the service role key (server-only)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createListing(formData: FormData) {
  const supabase = await createClient() // this should be server/client scoped in your lib
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // parse fields safely
  const title = (formData.get('title') as string) || ''
  const description = (formData.get('description') as string) || ''
  const category = (formData.get('category') as string) || 'Other'
  const priceRaw = (formData.get('price') as string) || '0'
  const price = Number(priceRaw)
  const price_cents = Math.round(price * 100) // store in cents
  const imageUrlsRaw = formData.get('imageUrls') as string | null
  const imageUrls = imageUrlsRaw ? JSON.parse(imageUrlsRaw) : [] // expect array of public URLs or storage paths

  // Extract university domain from email
  const extractDomain = (email?: string | null) => {
    if (!email) return 'unknown'
    const parts = email.split('@')
    return parts.length === 2 ? parts[1].toLowerCase() : 'unknown'
  }
  const university_domain = extractDomain(user.email)

  try {
    // 1) Upsert profile in public.users using admin client (avoids RLS issues)
    const { error: upsertErr } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email ?? null,
        display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        university_domain,
      })

    if (upsertErr) {
      return { error: upsertErr.message }
    }

    // 2) Insert listing using admin client (ensures FK ok)
    const { data: listingData, error: insertErr } = await supabaseAdmin
      .from('listings')
      .insert([
        {
          user_id: user.id,
          title,
          description,
          category,
          price: price_cents, // schema column is 'price' (stored in cents)
          image_urls: imageUrls,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (insertErr) {
      return { error: insertErr.message }
    }

    // revalidate and redirect
    revalidatePath('/marketplace')
    redirect('/marketplace')
  } catch (err: any) {
    return { error: err.message || 'Unexpected error' }
  }
}

export async function uploadImage(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return { error: 'No file provided' }
  }

  // Generate path and upload
  const ext = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 12)}.${ext}`
  const filePath = `${user.id}/${fileName}`

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('listings') // keep the same bucket name you used; change if bucket is different
    .upload(filePath, file)

  if (uploadErr) {
    return { error: uploadErr.message }
  }

  // Get public URL (or use signed URL if bucket is private)
  const { data: publicUrlData } = supabase.storage
    .from('listings')
    .getPublicUrl(filePath)

  return { url: publicUrlData.publicUrl }
}

export async function updateListing(listingId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Verify ownership
  const { data: existingListing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', listingId)
    .single()

  if (!existingListing || existingListing.user_id !== user.id) {
    return { error: 'Unauthorized - Not your listing' }
  }

  // Parse form data
  const title = (formData.get('title') as string) || ''
  const description = (formData.get('description') as string) || ''
  const category = (formData.get('category') as string) || 'Other'
  const priceRaw = (formData.get('price') as string) || '0'
  const price = Number(priceRaw)
  const price_cents = Math.round(price * 100)
  const imageUrlsRaw = formData.get('imageUrls') as string | null
  const imageUrls = imageUrlsRaw ? JSON.parse(imageUrlsRaw) : []

  // Update the listing
  const { error } = await supabase
    .from('listings')
    .update({
      title,
      description,
      category,
      price: price_cents,
      image_urls: imageUrls,
    })
    .eq('id', listingId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/marketplace')
  revalidatePath('/profile/' + user.id)
  revalidatePath('/item/' + listingId)
  redirect('/item/' + listingId)
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/marketplace')
  revalidatePath('/profile/' + user.id)
  return { success: true }
}
