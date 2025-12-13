import { createClient } from '@/lib/supabase/server'
import { isEduEmail } from '@/lib/utils/helpers'
import { checkUsernameAvailability } from '@/lib/auth/actions'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json()

    // Validate username
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // No format validation - only check uniqueness
    // Check username availability
    const usernameCheck = await checkUsernameAvailability(username)
    if (!usernameCheck.available) {
      return NextResponse.json(
        { error: usernameCheck.error || 'Username already exists — try another' },
        { status: 400 }
      )
    }

    // Validate .edu email
    if (!isEduEmail(email)) {
      return NextResponse.json(
        { error: 'Only .edu email addresses are allowed' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign up user
    // The username metadata is used by the database trigger to create the profile
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify that the profile was created with the username
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('username')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (profileError || !profile) {
      // ROLLBACK: Delete the auth user if profile creation failed
      console.error('Profile creation failed, rolling back auth user:', profileError)

      // Check if error is due to unique constraint violation (race condition)
      const errorMessage = profileError?.message?.toLowerCase() || ''
      const errorCode = (profileError as any)?.code || ''

      if (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorCode === '23505') {
        // PostgreSQL error code 23505 = unique_violation
        return NextResponse.json(
          { error: 'Username already exists — try another' },
          { status: 409 }
        )
      }

      // Note: We can't directly delete from auth.users via the client
      // The database trigger should have handled this, but if it failed,
      // the user will need to contact support or try signing up again

      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      )
    }

    // Double-check that username was set correctly
    if (profile.username?.toLowerCase() !== username.toLowerCase()) {
      console.error('Username mismatch after profile creation:', {
        expected: username,
        actual: profile.username
      })

      return NextResponse.json(
        { error: 'Failed to set username correctly. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Signup successful! Please check your email to verify your account.',
      user: authData.user
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
