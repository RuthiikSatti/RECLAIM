import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/username/update
 *
 * Update the authenticated user's username (case-insensitive uniqueness check)
 *
 * Request body: { username: string }
 * Response: { success: boolean, username?: string } | { error: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username } = body

    // Validate input
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      return NextResponse.json(
        { error: 'Username cannot be empty' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get current user's username
    const { data: currentUserData, error: currentUserError } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()

    if (currentUserError) {
      console.error('Error fetching current user:', currentUserError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    // If username hasn't changed (case-insensitive), no update needed
    if (currentUserData.username?.toLowerCase() === trimmedUsername.toLowerCase()) {
      return NextResponse.json({
        success: true,
        username: currentUserData.username,
        message: 'Username unchanged'
      })
    }

    // Check if new username is available (case-insensitive)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, username')
      .ilike('username', trimmedUsername)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking username availability:', checkError)
      return NextResponse.json(
        { error: 'Failed to check username availability' },
        { status: 500 }
      )
    }

    // If username exists and it's not the current user, it's taken
    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { error: 'Username already exists — try another' },
        { status: 409 }
      )
    }

    // Update username
    const { error: updateError } = await supabase
      .from('users')
      .update({
        username: trimmedUsername,
        display_name: trimmedUsername // Keep display_name in sync for backwards compatibility
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating username:', updateError)

      // Check if error is due to unique constraint violation
      const errorMessage = updateError.message?.toLowerCase() || ''
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        return NextResponse.json(
          { error: 'Username already exists — try another' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to update username' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      username: trimmedUsername,
      message: 'Username updated successfully!'
    })

  } catch (error) {
    console.error('Unexpected error in username update:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
