'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Sign in error:', error)
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Authentication failed' }
  }

  // Ensure user profile exists in public.users table
  const { data: existingProfile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('id', data.user.id)
    .single()

  // Create profile if it doesn't exist
  if (!existingProfile && !profileError) {
    const displayName = data.user.user_metadata?.display_name ||
                        data.user.user_metadata?.full_name ||
                        data.user.user_metadata?.name ||
                        email.split('@')[0]

    const universityDomain = email.split('@')[1] || ''

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: email,
        display_name: displayName,
        university_domain: universityDomain,
      })

    if (insertError) {
      console.error('Profile creation error:', insertError)
    }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/marketplace', 'page')
  redirect('/marketplace')
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
  }

  revalidatePath('/', 'layout')
  revalidatePath('/marketplace', 'page')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
