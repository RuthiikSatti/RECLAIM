import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client with service role key (server-side only)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch listing image_urls
    const { data: listing, error: dbError } = await supabase
      .from('listings')
      .select('image_urls')
      .eq('id', listingId)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (!listing || !listing.image_urls || listing.image_urls.length === 0) {
      return NextResponse.json({ images: [] })
    }

    // Process each image URL
    const processedImages: string[] = []

    for (const imageUrl of listing.image_urls) {
      // If already a full URL, use as-is
      if (/^https?:\/\//i.test(imageUrl)) {
        processedImages.push(imageUrl)
        continue
      }

      // Otherwise treat as storage path
      let bucket = 'public'
      let path = imageUrl

      // Determine bucket and clean path
      if (imageUrl.startsWith('public/')) {
        bucket = 'public'
        path = imageUrl.substring(7) // Remove 'public/' prefix
      } else if (imageUrl.startsWith('listings/') || imageUrl.startsWith('uploads/')) {
        bucket = 'public'
        path = imageUrl
      }

      // Attempt to create signed URL
      const { data: signedData, error: signedError } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(path, 3600)

      if (signedError || !signedData?.signedUrl) {
        // Fallback to public URL construction
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
        processedImages.push(publicUrl)
      } else {
        processedImages.push(signedData.signedUrl)
      }
    }

    return NextResponse.json({ images: processedImages })
  } catch (error: any) {
    console.error('Error processing listing images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
