/**
 * Email Service - Send transactional emails via Resend
 *
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Get API key
 * 3. Add to .env.local: RESEND_API_KEY=re_...
 * 4. Verify domain (optional for production)
 */

import { Resend } from 'resend'

// Initialize Resend only if API key is present
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    // Check if Resend is configured
    if (!resend) {
      console.warn('Resend API key not configured. Email not sent:', options.subject)
      return {
        success: false,
        error: 'RESEND_API_KEY not configured. Add it to .env.local to enable emails.'
      }
    }

    // Default from address
    const from = options.from || 'Reclaim <noreply@reclaim.app>'

    // Send email
    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    console.log('Email sent successfully:', data?.id)
    return { success: true, data }
  } catch (error: any) {
    console.error('Email send exception:', error)
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
