import { checkUsernameAvailability } from '@/lib/auth/actions'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const result = await checkUsernameAvailability(username)

    if (result.error) {
      return NextResponse.json(
        { error: result.error, available: false },
        { status: 400 }
      )
    }

    return NextResponse.json({ available: result.available })
  } catch (error) {
    console.error('Check username error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred', available: false },
      { status: 500 }
    )
  }
}
