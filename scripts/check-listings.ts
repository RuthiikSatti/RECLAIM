#!/usr/bin/env ts-node
/**
 * Check Listings Script
 *
 * Validates that recent listings exist and their images are accessible
 *
 * Usage: npx ts-node scripts/check-listings.ts
 */

import { createClient } from '@supabase/supabase-js'
import https from 'https'
import http from 'http'

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface Listing {
  id: string
  title: string
  price: number
  image_urls: string[] | null
  created_at: string
  user_id: string
}

async function checkImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url)
      const client = parsedUrl.protocol === 'https:' ? https : http

      const req = client.get(url, { timeout: 5000 }, (res) => {
        resolve(res.statusCode === 200)
      })

      req.on('error', () => resolve(false))
      req.on('timeout', () => {
        req.destroy()
        resolve(false)
      })
    } catch {
      resolve(false)
    }
  })
}

async function checkListings() {
  console.log('📋 Checking Listings\n')

  // Fetch recent listings
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, price, image_urls, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error fetching listings:', error.message)
    process.exit(1)
  }

  if (!listings || listings.length === 0) {
    console.log('ℹ️  No listings found in database\n')
    return
  }

  console.log(`Found ${listings.length} recent listings\n`)

  let totalImages = 0
  let accessibleImages = 0
  let listingsWithIssues = 0

  for (const listing of listings as Listing[]) {
    const hasIssues = []

    console.log(`\n📦 ${listing.title}`)
    console.log(`   ID: ${listing.id}`)
    console.log(`   Price: $${(listing.price / 100).toFixed(2)}`)
    console.log(`   Created: ${new Date(listing.created_at).toLocaleString()}`)

    if (!listing.image_urls || listing.image_urls.length === 0) {
      console.log('   ⚠️  No images')
      hasIssues.push('no-images')
    } else {
      console.log(`   Images: ${listing.image_urls.length}`)

      for (let i = 0; i < listing.image_urls.length; i++) {
        const url = listing.image_urls[i]
        totalImages++

        const accessible = await checkImageUrl(url)

        if (accessible) {
          console.log(`   ✅ Image ${i + 1}: OK`)
          accessibleImages++
        } else {
          console.log(`   ❌ Image ${i + 1}: NOT ACCESSIBLE`)
          console.log(`      URL: ${url}`)
          hasIssues.push(`image-${i + 1}-inaccessible`)
        }
      }
    }

    if (hasIssues.length > 0) {
      listingsWithIssues++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary')
  console.log('='.repeat(60))
  console.log(`Total listings checked: ${listings.length}`)
  console.log(`Listings with issues: ${listingsWithIssues}`)
  console.log(`Total images: ${totalImages}`)
  console.log(`Accessible images: ${accessibleImages}`)

  if (totalImages > 0) {
    const successRate = ((accessibleImages / totalImages) * 100).toFixed(1)
    console.log(`Image accessibility: ${successRate}%`)
  }

  if (listingsWithIssues === 0 && totalImages > 0 && accessibleImages === totalImages) {
    console.log('\n✅ All listings and images are healthy!\n')
    process.exit(0)
  } else if (listingsWithIssues > 0) {
    console.log('\n⚠️  Some listings have issues that need attention\n')
    process.exit(1)
  } else {
    console.log('\n✅ Check complete\n')
    process.exit(0)
  }
}

checkListings().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
