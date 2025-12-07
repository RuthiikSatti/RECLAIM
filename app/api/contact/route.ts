import { NextRequest, NextResponse } from 'next/server'

/**
 * Contact Form API Route
 *
 * Handles form submissions from the Contact Us page.
 * Currently logs to console - can be extended to send emails, save to database, etc.
 */

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { firstName, lastName, email, message } = body

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Log the contact form data
    console.log('📧 New Contact Form Submission:', {
      timestamp: new Date().toISOString(),
      name: `${firstName} ${lastName}`,
      email,
      phone: body.phone || 'Not provided',
      referralSource: body.referralSource || 'Not selected',
      signUpNewsletter: body.signUpNewsletter || false,
      message,
    })

    // TODO: Implement email sending or database storage
    // Example integrations:
    // - Send email via SendGrid, Resend, or similar
    // - Save to Supabase database
    // - Send to CRM or notification service

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Contact form submitted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
