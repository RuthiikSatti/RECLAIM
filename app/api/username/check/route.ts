import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/username/check
 *
 * Check if a username is available (case-insensitive)
 *
 * Request body: { username: string }
 * Response: { available: boolean } | { error: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username } = body

    // Validate input
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required', available: false },
        { status: 400 }
      )
    }

    // Trim username (no format validation - only check uniqueness)
    const trimmedUsername = username.trim()

    // Use regular client to check availability
    const supabase = await createClient()

    // Check for case-insensitive match using PostgreSQL lower() function
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .ilike('username', trimmedUsername)
      .maybeSingle()

    if (error) {
      // PGRST116 is PostgREST's "not found" code, which is expected when username is available
      if (error.code === 'PGRST116') {
        return NextResponse.json({ available: true })
      }

      // Log unexpected errors
      console.error('Error checking username availability:', error)
      return NextResponse.json(
        { error: 'Failed to check username availability', available: false },
        { status: 500 }
      )
    }

    // If data exists, username is taken
    const available = !data

    return NextResponse.json({ available })

  } catch (error) {
    console.error('Unexpected error in username check:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred', available: false },
      { status: 500 }
    )
  }
}
