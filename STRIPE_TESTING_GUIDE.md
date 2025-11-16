# Stripe Payment Testing Guide

Complete step-by-step guide for testing the Stripe payment integration in RECLAIM.

## 🚀 Quick Start

### Prerequisites
- Node.js and npm installed
- Stripe account (test mode)
- Stripe CLI installed
- `.env.local` configured with Stripe keys

---

## 📋 Setup Steps

### 1. Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
```bash
# Download from: https://github.com/stripe/stripe-cli/releases
# Or use Scoop:
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
# Download latest release from GitHub
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### 2. Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate. After login, the CLI will have access to your test mode data.

### 3. Verify Environment Variables

Ensure your `.env.local` has:

```env
# Stripe Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Will be provided by Stripe CLI

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 🧪 Local Testing Flow

### Terminal 1: Start Development Server

```bash
npm run dev
```

Output:
```
▲ Next.js 15.5.6
- Local:        http://localhost:3000
✓ Ready in 2.3s
```

### Terminal 2: Start Stripe Webhook Listener

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Output:
```
> Ready! Your webhook signing secret is whsec_xxx (^C to quit)
```

**Important:** Copy the `whsec_xxx` value and add it to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Keep both terminals running during testing!**

---

## 🛒 Test Payment Flow

### Step 1: Login as Buyer

1. Navigate to: `http://localhost:3000/login`
2. Login with buyer account credentials
3. You should see your profile in the navbar

### Step 2: Browse Marketplace

1. Go to: `http://localhost:3000/marketplace`
2. Click on any listing (not your own!)
3. Listing detail page should load

### Step 3: Initiate Purchase

1. Scroll to "Buy Now" button
2. Click **"Buy Now - $XX.XX"**
3. You should see:
   - Button shows spinner: "Processing..."
   - Redirect to Stripe Checkout (stripe.com domain)

**What happens behind the scenes:**
```
Frontend → POST /api/stripe/create-checkout-session
Server → Creates Stripe session + pending order in DB
Server → Returns { url: "https://checkout.stripe.com/..." }
Frontend → Redirects to Stripe Checkout
```

### Step 4: Complete Payment on Stripe

On Stripe Checkout page, enter:

**Test Card Number:** `4242 4242 4242 4242`
**Expiry Date:** Any future date (e.g., `12/34`)
**CVC:** Any 3 digits (e.g., `123`)
**ZIP/Postal Code:** Any 5 digits (e.g., `12345`)
**Name on Card:** `Test Buyer`

Click **"Pay"**

### Step 5: Webhook Processing

Watch **Terminal 2** (Stripe CLI). You should see:

```
2025-01-15 21:30:45  --> checkout.session.completed [evt_xxx]
2025-01-15 21:30:45  <-- [200] POST http://localhost:3000/api/stripe/webhook [evt_xxx]
2025-01-15 21:30:46  --> payment_intent.succeeded [evt_xxx]
2025-01-15 21:30:46  <-- [200] POST http://localhost:3000/api/stripe/webhook [evt_xxx]
```

**What happens:**
```
Stripe → Sends webhook: checkout.session.completed
Server → Updates order status: pending → paid
Server → Returns 200 OK
```

### Step 6: Order Success Page

You should be redirected to:
```
http://localhost:3000/orders/success?session_id=cs_test_xxx
```

Page should show:
- ✅ Green checkmark: "Payment Successful!"
- Order ID and details
- Item purchased (with image)
- Seller information
- "Message Seller" button
- "Continue Shopping" button

### Step 7: Verify in Database

**Option A: Supabase Dashboard**
1. Go to: Supabase Dashboard > Table Editor > orders
2. Find your order (sort by `created_at DESC`)
3. Verify:
   - `status` = `'paid'`
   - `stripe_checkout_session_id` = `cs_test_xxx`
   - `stripe_payment_intent_id` = `pi_xxx`
   - `amount_cents` = price × 100
   - `buyer_id` = your user ID
   - `seller_id` = listing owner ID

**Option B: SQL Query**
```sql
SELECT
  id,
  status,
  amount_cents / 100.0 AS amount_dollars,
  buyer_email,
  stripe_checkout_session_id,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

### Step 8: Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/payments
2. Find your payment
3. Verify:
   - Status: `Succeeded`
   - Amount: Correct price
   - Customer email: Your email
   - Metadata: `listingId`, `buyerId`, `sellerId`

---

## 💸 Test Refund Flow

### Step 1: Login as Seller

1. Logout current user
2. Login as the **seller** of the listing
3. Navigate to the listing detail page

### Step 2: View Order (Future Enhancement)

Currently, there's no dedicated "Orders" page. To test refunds, you can:

**Option A: Add RefundButton to Listing Page (for sellers)**

Add to `app/item/[id]/page.tsx` for owners:

```tsx
import RefundButton from '@/components/orders/RefundButton'

// In the owner section (where "Edit Listing" button is)
{isOwner && (
  <div className="border-t pt-4 mt-4">
    {/* Fetch recent orders for this listing */}
    <RecentOrdersForSeller listingId={listing.id} />
  </div>
)}
```

**Option B: Use API Directly (Developer Testing)**

```bash
# Get order ID from Supabase
# Then call refund API with curl:

curl -X POST http://localhost:3000/api/stripe/refund \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "orderId": "your-order-uuid-here",
    "reason": "requested_by_customer"
  }'
```

**Option C: Use Stripe Dashboard**

1. Go to: https://dashboard.stripe.com/test/payments
2. Find the payment
3. Click **"Refund"**
4. Enter full amount
5. Click **"Refund $XX.XX"**

### Step 3: Watch Webhook

Terminal 2 should show:

```
2025-01-15 21:35:12  --> charge.refunded [evt_xxx]
2025-01-15 21:35:12  <-- [200] POST http://localhost:3000/api/stripe/webhook [evt_xxx]
```

### Step 4: Verify Refund

**Database:**
```sql
SELECT
  id,
  status,
  stripe_refund_id,
  refunded_at,
  amount_cents / 100.0 AS amount_dollars
FROM orders
WHERE id = 'your-order-id'
LIMIT 1;
```

Should show:
- `status` = `'refunded'`
- `stripe_refund_id` = `re_xxx`
- `refunded_at` = timestamp

**Stripe Dashboard:**
- Payment shows "Refunded" badge
- Refund transaction listed

---

## 🧪 Test Cards

### Success Cases

| Card Number          | Description                 |
|---------------------|----------------------------|
| 4242 4242 4242 4242 | Visa - Always succeeds     |
| 5555 5555 5555 4444 | Mastercard - Succeeds      |
| 3782 822463 10005   | American Express - Succeeds |

### Require Authentication (3D Secure)

| Card Number          | Description                    |
|---------------------|--------------------------------|
| 4000 0025 0000 3155 | Visa - Requires authentication |
| 4000 0027 6000 3184 | Visa - Requires auth (GB)      |

**Testing 3DS:**
- Complete button shows "Complete authentication"
- Modal appears with authentication challenge
- Click "Authenticate" to proceed
- Payment succeeds after authentication

### Declined Cards

| Card Number          | Description                      |
|---------------------|----------------------------------|
| 4000 0000 0000 9995 | Visa - Always declined           |
| 4000 0000 0000 0002 | Visa - Declined (card declined)  |
| 4000 0000 0000 9987 | Visa - Declined (lost card)      |

**Expected behavior:**
- Payment fails
- Error message shown on Stripe page
- No order created in database
- User remains on Stripe Checkout (can retry)

---

## 🐛 Common Issues & Solutions

### Issue 1: Webhook Secret Mismatch

**Error:**
```
Webhook signature verification failed
```

**Solution:**
1. Check Terminal 2 for the `whsec_xxx` value
2. Ensure it matches `STRIPE_WEBHOOK_SECRET` in `.env.local`
3. Restart dev server after updating env var

### Issue 2: Order Not Updating to "Paid"

**Symptoms:**
- Payment succeeds on Stripe
- Order stays in "pending" status
- Success page shows error

**Debugging:**
1. Check Terminal 2 for webhook events
2. Check server logs in Terminal 1 for errors
3. Verify Stripe webhook endpoint returned 200
4. Check Supabase logs (Dashboard > Logs)

**Common Causes:**
- Webhook secret mismatch
- Database RLS policy blocking update
- Missing Stripe metadata

### Issue 3: "Cannot Purchase Your Own Listing"

**Error message on Buy button click**

**Solution:**
- This is expected! You can't buy your own items
- Login as a different user or create a new test account

### Issue 4: Redirect to Login Instead of Checkout

**Behavior:**
- Click "Buy Now"
- Redirected to `/login` page

**Cause:**
- User not authenticated

**Solution:**
- Login first, then try purchasing

### Issue 5: Session Expired

**Error on Stripe Checkout:**
```
This checkout session has expired.
```

**Cause:**
- Checkout sessions expire after 30 minutes

**Solution:**
- Go back to listing page
- Click "Buy Now" again to create a new session

---

## 📊 Testing Checklist

Use this checklist to verify all functionality:

### Happy Path

- [ ] User can login successfully
- [ ] Marketplace shows listings
- [ ] Buy button visible on listing detail page
- [ ] Click Buy → Redirects to Stripe Checkout
- [ ] Can enter test card details
- [ ] Payment succeeds
- [ ] Webhook fires and updates order
- [ ] Redirected to success page
- [ ] Order details shown correctly
- [ ] Database shows order with status='paid'
- [ ] Stripe Dashboard shows successful payment

### Edge Cases

- [ ] Unauthenticated user → Redirected to login
- [ ] Owner clicks own listing → Error message shown
- [ ] Declined card → Error shown, no order created
- [ ] 3DS authentication → Modal works, payment succeeds
- [ ] Session expires → Can create new session
- [ ] Webhook delay → Success page shows "processing"
- [ ] Refund works → Status updates to 'refunded'

### Error Handling

- [ ] Network error → User-friendly error message
- [ ] Invalid listing ID → 404 error
- [ ] Missing Stripe keys → Config error
- [ ] Database connection error → Graceful error

---

## 🎯 Advanced Testing

### Test Webhook Retry

Simulate webhook failure:

```bash
# Stop dev server (Terminal 1)
# Keep Stripe CLI running (Terminal 2)
# Complete a payment on Stripe Dashboard

# Stripe will retry webhook
# Start dev server again
# Webhook will succeed on retry
```

### Test Concurrent Purchases

1. Open listing in 2 browser tabs
2. Login as different users in each tab
3. Click "Buy Now" in both tabs simultaneously
4. Complete payments in both
5. Verify both orders created successfully

### Test Amount Validation

Try to manipulate amount:

```javascript
// This should be prevented by server-side validation
// Server always uses listing.price from database, not client input
```

### Test Platform Fee Calculation

```sql
SELECT
  amount_cents / 100.0 AS total,
  platform_fee_cents / 100.0 AS fee,
  seller_amount_cents / 100.0 AS seller_gets,
  (amount_cents - platform_fee_cents - seller_amount_cents) AS discrepancy
FROM orders
WHERE id = 'order-id';
```

Should show:
- `discrepancy` = 0 (no rounding errors)
- `fee` ≈ 10% of `total` (default platform fee)

---

## 📝 Test Scenarios

### Scenario 1: First-Time Buyer

```
1. Create new account → Sign up
2. Verify email (if enabled)
3. Browse marketplace
4. Click listing
5. Click Buy Now
6. See Stripe Checkout for first time
7. Enter card details
8. Complete payment
9. See success page
10. Check email for receipt (Stripe sends this)
```

### Scenario 2: Repeat Purchase

```
1. Login existing buyer
2. Purchase another item
3. Stripe remembers card (if saved)
4. Faster checkout experience
```

### Scenario 3: Seller Refund

```
1. Login as seller
2. View orders (when implemented)
3. Click "Refund" on order
4. Confirm refund
5. See success message
6. Order status updates
7. Buyer receives refund email from Stripe
```

---

## 🚀 Production Testing

Before going live:

### 1. Switch to Live Mode

Update `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### 2. Create Production Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.refunded`
4. Copy signing secret → Production env vars

### 3. Test with Real Card (Small Amount)

- Use your own card
- Purchase cheapest item
- Verify full flow works
- Request refund to test that too

### 4. Monitor in Production

- Check Stripe Dashboard regularly
- Set up email alerts for failed webhooks
- Monitor error logs
- Track successful vs failed payments

---

## 📞 Support Resources

- **Stripe Docs:** https://stripe.com/docs
- **Stripe API Logs:** https://dashboard.stripe.com/test/logs
- **Stripe Support:** https://support.stripe.com
- **Test Cards:** https://stripe.com/docs/testing

---

## 🎓 Learning Resources

- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Stripe](https://stripe.com/docs/testing)
- [Stripe Dashboard Tour](https://stripe.com/docs/dashboard)

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Author:** RECLAIM Team
