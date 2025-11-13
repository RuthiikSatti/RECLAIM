import { createClient } from '@/lib/supabase/server'
import { isEduEmail, extractUniversityDomain } from '@/lib/utils/helpers'
import { NextResponse } from 'next/server'

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

    // Create user profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          display_name: displayName,
          university_domain: extractUniversityDomain(email),
        })

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ 
      message: 'Signup successful! Please check your email to verify your account.',
      user: authData.user 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
