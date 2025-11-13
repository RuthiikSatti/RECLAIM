// fetch-listings-by-email.ts
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local if present
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  })
} catch {
  // no .env.local — ok
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.')
  console.error('Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local or environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fetchListingsByEmail(email: string) {
  console.log(`\n🔍 Searching for user with email: ${email}\n`)

  // case-insensitive lookup
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
    .single()

  if (userError || !user) {
    console.error(`❌ User not found: ${userError?.message || 'No user with that email'}`)
    process.exit(1)
  }

  console.log('✅ User found:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Display Name: ${user.display_name || 'N/A'}`)
  console.log(`   University Domain: ${user.university_domain || 'N/A'}`)
  console.log(`   Created At: ${user.created_at}\n`)

  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (listingsError) {
    console.error(`❌ Error fetching listings: ${listingsError.message}`)
    process.exit(1)
  }

  if (!listings || listings.length === 0) {
    console.log('📭 No listings found for this user.\n')
    return
  }

  console.log(`📋 Found ${listings.length} listing(s):\n`)
  console.log('─'.repeat(80))

  listings.forEach((listing: any, index: number) => {
    // support price in cents or plain dollars
    const priceCents = listing.price_cents ?? listing.price ?? 0
    const priceDollars = (Number(priceCents) / 100).toFixed(2)
    const imageCount = Array.isArray(listing.image_urls) ? listing.image_urls.length : 0
    const date = listing.created_at ? new Date(listing.created_at).toLocaleString() : 'N/A'
    const desc = listing.description ? String(listing.description) : ''

    console.log(`\n${index + 1}. ${listing.title || 'Untitled'}`)
    console.log(`   ID: ${listing.id}`)
    console.log(`   Category: ${listing.category || 'N/A'}`)
    console.log(`   Price: $${priceDollars}`)
    console.log(`   Images: ${imageCount}`)
    console.log(`   Created: ${date}`)
    console.log(`   Description: ${desc.substring(0, 100)}${desc.length > 100 ? '...' : ''}`)

    if (imageCount > 0) {
      console.log(`   Image URLs:`)
      listing.image_urls.forEach((url: string, i: number) => {
        console.log(`      ${i + 1}. ${url}`)
      })
    }
  })

  console.log('\n' + '─'.repeat(80))
  console.log(`\n✅ Total: ${listings.length} listing(s)\n`)
}

// CLI arg
const email = process.argv[2]
if (!email) {
  console.error('❌ Error: Email address required')
  console.error('\nUsage: npx tsx fetch-listings-by-email.ts user@example.com')
  process.exit(1)
}

fetchListingsByEmail(email).catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
