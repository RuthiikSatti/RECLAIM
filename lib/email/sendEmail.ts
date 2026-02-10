/**
 * Email Service - Send transactional emails via Brevo
 *
 * Setup:
 * 1. Sign up at https://www.brevo.com
 * 2. Verify your sender in Brevo Dashboard -> Senders & IP -> Senders
 * 3. Get API key from SMTP & API -> API Keys
 * 4. Add to .env.local:
 *    BREVO_API_KEY=xkeysib-...
 *    BREVO_SENDER_EMAIL=no-reply@ume-life.com (must be verified in Brevo)
 *    SUPPORT_EMAIL=umelife.official@gmail.com (recipient + reply-to)
 *
 * Email Flow:
 * - FROM: BREVO_SENDER_EMAIL (verified Brevo sender)
 * - TO: SUPPORT_EMAIL (Gmail inbox)
 * - REPLY-TO: SUPPORT_EMAIL (so replies go to Gmail)
 *
 * Testing:
 * - Set EMAIL_TEST_MODE=true to mock email sending
 * - Emails will be logged to /tmp/email-test-log.json (or temp dir on Windows)
 */

// Note: We use direct fetch API instead of Brevo SDK for faster execution in serverless
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Test mode log file path
const EMAIL_TEST_LOG_PATH = path.join(os.tmpdir(), 'email-test-log.json')

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface EmailLogEntry {
  timestamp: string
  payload: {
    sender: { name: string; email: string }
    to: { email: string }[]
    subject: string
    replyTo: { email: string }
  }
  success: boolean
  testMode: boolean
}

/**
 * Get the path to the email test log file
 */
export function getEmailTestLogPath(): string {
  return EMAIL_TEST_LOG_PATH
}

/**
 * Read all logged emails from test mode
 */
export function readEmailTestLog(): EmailLogEntry[] {
  try {
    if (fs.existsSync(EMAIL_TEST_LOG_PATH)) {
      const content = fs.readFileSync(EMAIL_TEST_LOG_PATH, 'utf-8')
      return JSON.parse(content)
    }
  } catch {
    // Ignore errors, return empty array
  }
  return []
}

/**
 * Clear the email test log
 */
export function clearEmailTestLog(): void {
  try {
    if (fs.existsSync(EMAIL_TEST_LOG_PATH)) {
      fs.unlinkSync(EMAIL_TEST_LOG_PATH)
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Log email to test file (used in test mode)
 */
function logEmailToTestFile(entry: EmailLogEntry): void {
  try {
    const logs = readEmailTestLog()
    logs.push(entry)
    fs.writeFileSync(EMAIL_TEST_LOG_PATH, JSON.stringify(logs, null, 2))
  } catch (error) {
    console.error('[EMAIL] Failed to write test log:', error)
  }
}

/**
 * Send an email using Brevo API
 * @param options - Email options (to, subject, html, optional from/replyTo)
 * @returns { success: boolean, data?: object, error?: string }
 */
export async function sendEmail(options: EmailOptions) {
  // Build payload for logging
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@ume-life.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'UME Marketplace'
  const replyToEmail = options.replyTo || process.env.SUPPORT_EMAIL || 'umelife.official@gmail.com'
  const recipients = Array.isArray(options.to) ? options.to : [options.to]

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: recipients.map(email => ({ email })),
    subject: options.subject,
    replyTo: { email: replyToEmail },
  }

  // Test mode: log email instead of sending
  if (process.env.EMAIL_TEST_MODE === 'true') {
    console.log('[EMAIL] TEST MODE - Email not sent, logging instead')
    console.log('[EMAIL] Payload:', JSON.stringify(payload, null, 2))

    const logEntry: EmailLogEntry = {
      timestamp: new Date().toISOString(),
      payload,
      success: true,
      testMode: true,
    }
    logEmailToTestFile(logEntry)

    return {
      success: true,
      data: { messageId: `test-${Date.now()}` },
      testMode: true,
    }
  }

  // Check if Brevo is configured
  if (!process.env.BREVO_API_KEY) {
    console.error('[EMAIL] BREVO_API_KEY not configured - email not sent')
    console.error('[EMAIL] Payload:', JSON.stringify(payload, null, 2))
    return {
      success: false,
      error: 'BREVO_API_KEY not configured. Add it to environment variables to enable emails.'
    }
  }

  console.log('[EMAIL] Sending email via Brevo...')
  console.log('[EMAIL] To:', recipients.join(', '))
  console.log('[EMAIL] Subject:', options.subject)

  // Use direct fetch API for faster execution in serverless (SDK can be slow)
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: payload.sender,
        to: payload.to,
        subject: options.subject,
        htmlContent: options.html,
        replyTo: payload.replyTo,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('[EMAIL] Sent successfully! MessageId:', data.messageId)
      return { success: true, data }
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('[EMAIL] Failed:', response.status, errorData)
      return { success: false, error: errorData.message || `HTTP ${response.status}` }
    }
  } catch (error: any) {
    console.error('[EMAIL] Network error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send buyer confirmation email
 */
export async function sendBuyerConfirmation({
  buyerEmail,
  buyerName,
  orderId,
  listingTitle,
  listingPrice,
  sellerName,
  sellerEmail,
  orderDate,
}: {
  buyerEmail: string
  buyerName: string
  orderId: string
  listingTitle: string
  listingPrice: number
  sellerName: string
  sellerEmail: string
  orderDate: string
}) {
  const priceFormatted = `$${(listingPrice / 100).toFixed(2)}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .order-details h3 { margin-top: 0; color: #667eea; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #555; }
    .value { color: #333; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .button:hover { background: #5568d3; }
    .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Payment Confirmed!</h1>
    <p>Thank you for your purchase on Reclaim</p>
  </div>

  <div class="content">
    <p>Hi ${buyerName},</p>

    <p>Great news! Your payment has been successfully processed. Here are your order details:</p>

    <div class="order-details">
      <h3>Order Summary</h3>
      <div class="detail-row">
        <span class="label">Order ID:</span>
        <span class="value">${orderId}</span>
      </div>
      <div class="detail-row">
        <span class="label">Item:</span>
        <span class="value">${listingTitle}</span>
      </div>
      <div class="detail-row">
        <span class="label">Amount Paid:</span>
        <span class="value"><strong>${priceFormatted}</strong></span>
      </div>
      <div class="detail-row">
        <span class="label">Purchase Date:</span>
        <span class="value">${new Date(orderDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</span>
      </div>
    </div>

    <div class="highlight">
      <strong>📦 What's Next?</strong><br>
      The seller (${sellerName}) has been notified and will prepare your item for shipment. You'll receive another email with tracking information once the item ships.
    </div>

    <h3>Seller Information</h3>
    <p>
      <strong>Seller:</strong> ${sellerName}<br>
      <strong>Contact:</strong> ${sellerEmail}
    </p>

    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderId}" class="button">
        View Order Status
      </a>
    </p>

    <p style="color: #666; font-size: 14px;">
      <strong>Need help?</strong> If you have any questions about your order, please reply to this email or contact the seller directly.
    </p>
  </div>

  <div class="footer">
    <p>This is an automated receipt from Reclaim Marketplace</p>
    <p>© ${new Date().getFullYear()} Reclaim. All rights reserved.</p>
    <p style="margin-top: 10px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="color: #667eea; text-decoration: none;">Visit Reclaim</a> |
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support" style="color: #667eea; text-decoration: none;">Support</a>
    </p>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: buyerEmail,
    subject: 'Your Reclaim Purchase Confirmation',
    html,
  })
}

/**
 * Send seller notification email
 */
export async function sendSellerNotification({
  sellerEmail,
  sellerName,
  orderId,
  listingTitle,
  listingPrice,
  buyerName,
  buyerEmail,
  buyerShippingAddress,
  orderDate,
}: {
  sellerEmail: string
  sellerName: string
  orderId: string
  listingTitle: string
  listingPrice: number
  buyerName: string
  buyerEmail: string
  buyerShippingAddress?: any
  orderDate: string
}) {
  const priceFormatted = `$${(listingPrice / 100).toFixed(2)}`
  const platformFee = listingPrice * 0.10
  const sellerPayout = listingPrice - platformFee
  const sellerPayoutFormatted = `$${(sellerPayout / 100).toFixed(2)}`

  let addressHtml = ''
  if (buyerShippingAddress) {
    addressHtml = `
      <div class="order-details">
        <h3>📍 Shipping Address</h3>
        <p>
          ${buyerShippingAddress.name || buyerName}<br>
          ${buyerShippingAddress.line1 || ''}<br>
          ${buyerShippingAddress.line2 ? buyerShippingAddress.line2 + '<br>' : ''}
          ${buyerShippingAddress.city || ''}, ${buyerShippingAddress.state || ''} ${buyerShippingAddress.postal_code || ''}<br>
          ${buyerShippingAddress.country || 'USA'}
        </p>
      </div>
    `
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You Made a Sale!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .order-details h3 { margin-top: 0; color: #10b981; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #555; }
    .value { color: #333; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .button:hover { background: #059669; }
    .highlight { background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px; }
    .checklist { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .checklist h3 { margin-top: 0; color: #d97706; }
    .checklist ul { margin: 10px 0; padding-left: 20px; }
    .checklist li { padding: 5px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 You Made a Sale!</h1>
    <p>Congratulations! Someone just purchased your item</p>
  </div>

  <div class="content">
    <p>Hi ${sellerName},</p>

    <p>Great news! Your item has been sold on Reclaim. Here are the details:</p>

    <div class="order-details">
      <h3>Sale Summary</h3>
      <div class="detail-row">
        <span class="label">Order ID:</span>
        <span class="value">${orderId}</span>
      </div>
      <div class="detail-row">
        <span class="label">Item Sold:</span>
        <span class="value">${listingTitle}</span>
      </div>
      <div class="detail-row">
        <span class="label">Sale Price:</span>
        <span class="value">${priceFormatted}</span>
      </div>
      <div class="detail-row">
        <span class="label">Your Payout:</span>
        <span class="value"><strong>${sellerPayoutFormatted}</strong></span>
      </div>
      <div class="detail-row">
        <span class="label">Sale Date:</span>
        <span class="value">${new Date(orderDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</span>
      </div>
    </div>

    <div class="order-details">
      <h3>👤 Buyer Information</h3>
      <p>
        <strong>Name:</strong> ${buyerName}<br>
        <strong>Email:</strong> ${buyerEmail}
      </p>
    </div>

    ${addressHtml}

    <div class="checklist">
      <h3>📦 Next Steps - Prepare to Ship</h3>
      <ul>
        <li>✅ Package the item securely</li>
        <li>✅ Print a shipping label (USPS, UPS, or FedEx)</li>
        <li>✅ Add tracking number in your Reclaim dashboard</li>
        <li>✅ Ship within 2 business days</li>
        <li>✅ Mark as shipped once it's on its way</li>
      </ul>
    </div>

    <div class="highlight">
      <strong>💡 Shipping Tips:</strong><br>
      • Use a tracked shipping method<br>
      • Take photos of the packaged item<br>
      • Keep your shipping receipt<br>
      • Update tracking info in your dashboard
    </div>

    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderId}" class="button">
        Add Tracking Number
      </a>
    </p>

    <p style="color: #666; font-size: 14px;">
      <strong>Questions?</strong> You can contact the buyer at ${buyerEmail} if you need to clarify shipping details.
    </p>
  </div>

  <div class="footer">
    <p>This is an automated notification from Reclaim Marketplace</p>
    <p>© ${new Date().getFullYear()} Reclaim. All rights reserved.</p>
    <p style="margin-top: 10px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="color: #10b981; text-decoration: none;">Visit Reclaim</a> |
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support" style="color: #10b981; text-decoration: none;">Support</a>
    </p>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: sellerEmail,
    subject: `🎉 You sold "${listingTitle}"! Prepare to ship`,
    html,
  })
}

/**
 * Send order shipped notification to buyer
 */
export async function sendShippedNotification({
  buyerEmail,
  buyerName,
  orderId,
  listingTitle,
  trackingNumber,
  shippingCarrier,
}: {
  buyerEmail: string
  buyerName: string
  orderId: string
  listingTitle: string
  trackingNumber: string
  shippingCarrier?: string
}) {
  const trackingUrl = getTrackingUrl(shippingCarrier, trackingNumber)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Shipped</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .tracking-box { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #3b82f6; }
    .tracking-number { font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 2px; margin: 10px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📦 Your Order Has Shipped!</h1>
  </div>

  <div class="content">
    <p>Hi ${buyerName},</p>

    <p>Good news! Your order has been shipped and is on its way to you.</p>

    <p><strong>Item:</strong> ${listingTitle}</p>

    <div class="tracking-box">
      <p style="margin: 0; color: #1e40af; font-weight: 600;">Tracking Number</p>
      <div class="tracking-number">${trackingNumber}</div>
      ${shippingCarrier ? `<p style="margin: 10px 0 0 0; color: #64748b;">Carrier: ${shippingCarrier}</p>` : ''}
    </div>

    ${trackingUrl ? `
      <p style="text-align: center;">
        <a href="${trackingUrl}" class="button" target="_blank">
          Track Your Package
        </a>
      </p>
    ` : ''}

    <p style="color: #666; font-size: 14px;">
      Delivery times may vary depending on the carrier and your location. If you have any questions about your shipment, please contact the seller.
    </p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} Reclaim. All rights reserved.</p>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: buyerEmail,
    subject: `📦 Your order has shipped - ${listingTitle}`,
    html,
  })
}

/**
 * Get tracking URL for common carriers
 */
function getTrackingUrl(carrier?: string, trackingNumber?: string): string | null {
  if (!trackingNumber) return null

  const carrierLower = carrier?.toLowerCase() || ''

  if (carrierLower.includes('usps')) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`
  } else if (carrierLower.includes('ups')) {
    return `https://www.ups.com/track?tracknum=${trackingNumber}`
  } else if (carrierLower.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`
  } else if (carrierLower.includes('dhl')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`
  }

  return null
}

/**
 * Send report notification to support team
 */
export async function sendReportNotification({
  listingId,
  reportReason,
  reporterId,
  timestamp,
}: {
  listingId: string
  reportReason: string
  reporterId: string
  timestamp: string
}) {
  const supportEmail = process.env.SUPPORT_EMAIL || 'umelife.official@gmail.com'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Listing Reported</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .report-details { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #fee2e2; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #991b1b; }
    .value { color: #333; margin-left: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ New Listing Report</h1>
  </div>

  <div class="content">
    <p>A listing has been reported on the UME marketplace and requires review.</p>

    <div class="report-details">
      <div class="detail-row">
        <span class="label">Listing ID:</span>
        <span class="value">${listingId}</span>
      </div>
      <div class="detail-row">
        <span class="label">Reporter ID:</span>
        <span class="value">${reporterId}</span>
      </div>
      <div class="detail-row">
        <span class="label">Report Reason:</span>
        <span class="value">${reportReason}</span>
      </div>
      <div class="detail-row">
        <span class="label">Reported At:</span>
        <span class="value">${new Date(timestamp).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })}</span>
      </div>
    </div>

    <p style="color: #666; font-size: 14px;">
      Please review this report in your admin dashboard and take appropriate action.
    </p>
  </div>

  <div class="footer">
    <p>This is an automated notification from UME Support System</p>
    <p>© ${new Date().getFullYear()} UME. All rights reserved.</p>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: supportEmail,
    subject: '[UME] Listing Reported',
    html,
  })
}
