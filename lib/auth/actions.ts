'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function prettyLogError(prefix: string, err: any) {
  try {
    // Many Supabase errors are objects that don't show useful console output unless stringified
    console.error(prefix, err?.message ?? JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    // also attempt to print known fields
    if (err && typeof err === 'object') {
      console.error(prefix + ' (fields):', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        // full object as fallback
        raw: JSON.stringify(err, Object.getOwnPropertyNames(err)),
      });
    }
  } catch (e) {
    console.error(prefix, err);
  }
}

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
    prettyLogError('Sign in error:', error)
    return { error: error.message ?? 'Sign in failed' }
  }

  if (!data.user) {
    return { error: 'Authentication failed' }
  }

  // Profile creation is now handled by the database trigger automatically
  // No need for manual profile creation logic here

  revalidatePath('/', 'layout')
  revalidatePath('/marketplace', 'page')

  try {
    redirect('/marketplace')
  } catch (error) {
    throw error
  }
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    prettyLogError('Sign out error:', error)
  }

  revalidatePath('/', 'layout')
  revalidatePath('/marketplace', 'page')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data, error: getUserError } = await supabase.auth.getUser()

  // Handle missing auth session gracefully (not an error state)
  if (getUserError) {
    const errorMessage = getUserError.message?.toLowerCase() || ''
    if (errorMessage.includes('auth session missing') || errorMessage.includes('session not found')) {
      // This is a normal state when user is not logged in
      return { user: null, error: null }
    }
    // Other errors should be logged
    prettyLogError('supabase.auth.getUser error:', getUserError)
    return { user: null, error: getUserError }
  }

  const user = data?.user ?? null
  if (!user) return { user: null, error: null }

  try {
    // The database trigger should have created the profile automatically
    // We'll retry a few times in case there's a slight delay
    let profile = null
    let attempts = 0
    const maxAttempts = 3

    while (!profile && attempts < maxAttempts) {
      const { data, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 is "not found", which is expected on first attempt
        prettyLogError('Profile lookup error in getUser:', profileError)
      }

      if (data) {
        profile = data
        break
      }

      attempts++
      if (attempts < maxAttempts) {
        // Wait a bit before retrying (50ms)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    if (profile) {
      return { user: profile, error: null }
    }

    // If still no profile after retries, return a fallback
    // This should rarely happen with the trigger in place
    prettyLogError('Profile not found after retries in getUser', {
      userId: user.id,
      email: user.email
    })

    const fallbackUser = {
      id: user.id,
      email: user.email || '',
      display_name: (user.user_metadata?.display_name ??
                     user.user_metadata?.full_name ??
                     user.user_metadata?.name ??
                     user.email?.split('@')[0]) || 'User',
      university_domain: user.email?.split('@')[1] || '',
      created_at: new Date().toISOString()
    }
    return { user: fallbackUser, error: null }
  } catch (err) {
    prettyLogError('Unexpected error in getUser:', err)
    const fallbackUser = {
      id: user.id,
      email: user.email || '',
      display_name: (user.user_metadata?.name ?? user.email?.split('@')[0]) || 'User',
      university_domain: user.email?.split('@')[1] || '',
      created_at: new Date().toISOString()
    }
    return { user: fallbackUser, error: null }
  }
}
