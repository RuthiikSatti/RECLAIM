import { createClient } from '@/lib/supabase/server'
import { isEduEmail } from '@/lib/utils/helpers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json()

    // Validate .edu email
    if (!isEduEmail(email)) {
      return NextResponse.json(
        { error: 'Only .edu email addresses are allowed' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign up user
    // The display_name metadata is used by the database trigger to create the profile
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Profile creation is now handled automatically by the database trigger
    // on auth.users INSERT. No need for manual profile creation.

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
