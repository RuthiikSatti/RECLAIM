# Stripe Integration - Developer Notes

Quick reference for testing Stripe payments in RECLAIM.

## 🚀 Quick Start

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy webhook secret from Terminal 2 output to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## 🧪 Test Flow

1. **Login as buyer**
   - Go to http://localhost:3000/login
   - Login with test account

2. **Purchase item**
   - Go to http://localhost:3000/marketplace
   - Click any listing (not your own)
   - Click "Buy Now" button
   - Redirected to Stripe Checkout

3. **Complete payment**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
   - Click "Pay"

4. **Verify success**
   - Redirected to `/orders/success?session_id=cs_test_xxx`
   - Terminal 2 shows webhook events
   - Check Supabase: `orders` table → status='paid'

5. **Test refund** (optional)
   - Use Stripe Dashboard: https://dashboard.stripe.com/test/payments
   - Find payment → Click "Refund"
   - Webhook updates order status to 'refunded'

## 🧪 Test Cards

| Card                 | Result                  |
|---------------------|-------------------------|
| 4242 4242 4242 4242 | Success                |
| 4000 0025 0000 3155 | Requires authentication |
| 4000 0000 0000 9995 | Declined               |

## 📁 Key Files

**Frontend:**
- `components/listings/BuyButton.tsx` - Purchase button
- `app/orders/success/page.tsx` - Order confirmation
- `components/orders/RefundButton.tsx` - Refund control
- `components/ui/Toast.tsx` - Notifications
- `components/ui/Spinner.tsx` - Loading indicator

**Backend:**
- `app/api/stripe/create-checkout-session/route.ts` - Creates checkout
- `app/api/stripe/webhook/route.ts` - Processes webhooks
- `app/api/stripe/refund/route.ts` - Issues refunds

**Database:**
- `supabase/migrations/20250115210000_add_stripe_payments.sql` - Orders schema

## 🐛 Troubleshooting

**Order not updating to 'paid':**
- Check Terminal 2 for webhook events
- Verify `STRIPE_WEBHOOK_SECRET` matches
- Restart dev server after env change

**"Cannot purchase your own listing":**
- Login as different user
- This is expected behavior!

**Redirected to login:**
- User not authenticated
- Login first, then try again

## 📚 Documentation

- Full setup guide: `STRIPE_SETUP_GUIDE.md`
- Detailed testing: `STRIPE_TESTING_GUIDE.md`
- Stripe Dashboard: https://dashboard.stripe.com/test

## ✅ Testing Checklist

- [ ] Unauthenticated → Redirected to login
- [ ] Owner clicks own listing → Error shown
- [ ] Successful payment → Order created
- [ ] Webhook fires → Status updated
- [ ] Success page shows details
- [ ] Refund works via Dashboard
- [ ] Declined card → No order created
