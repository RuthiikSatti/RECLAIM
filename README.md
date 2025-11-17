# 🎓 RECLAIM - Campus Marketplace MVP

**A trusted marketplace exclusively for university students to buy, sell, and reclaim campus essentials.**

Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Enabling Payments](#enabling-payments)
- [Operations](#operations)
- [Contributing](#contributing)

---

## ✨ Features

### Core Features
- 🔐 **University Email Authentication** (.edu email required)
- 📦 **Listing Management** (Create, edit, delete listings)
- 🖼️ **Image Upload** (Up to 10 images per listing)
- 💬 **Real-time Messaging** (Chat with buyers/sellers)
- 🔍 **Advanced Search & Filtering** (By category, price, condition)
- 📊 **Admin Moderation** (Report listings, CSV export)

### Payment Features (Currently Disabled)
- 💳 **Stripe Integration** (Test mode only, feature-flagged)
- 📧 **Email Notifications** (Order confirmations, shipping updates)
- 🔔 **In-app Notifications** (Real-time alerts)
- 📦 **Order Tracking** (Shipping status, tracking numbers)

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime
- **Payments:** Stripe (test mode only)
- **Email:** Resend
- **Deployment:** Vercel
- **Analytics:** Mixpanel

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Stripe account (test mode)
- (Optional) Resend account for emails

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RECLAIM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your actual values (see [Environment Variables](#environment-variables))

4. **Run database migrations**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run each migration file in `supabase/migrations/` in order (by filename)

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

### Required Variables

```bash
# Supabase (Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # SERVER-SIDE ONLY!

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
FEATURE_PAYMENTS_ENABLED=false  # Keep false until ready for production
FEATURE_ADMIN_ENABLED=true

# Admin Configuration
ADMIN_EMAILS=admin@youruniversity.edu  # Comma-separated list
```

### Optional Variables

```bash
# Stripe (Test Mode - Get from: https://dashboard.stripe.com/test/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Get from: https://resend.com/api-keys)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Analytics (Get from: https://mixpanel.com)
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
```

### Security Notes

⚠️ **CRITICAL:**
- Never commit `.env.local` to version control
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Use environment variables in Vercel for production
- Rotate keys immediately if accidentally exposed

---

## 🗄️ Database Setup

### Migrations

Run migrations in order from the Supabase SQL Editor:

```sql
-- 1. Enhanced messaging
supabase/migrations/20250113000000_add_read_field_to_messages.sql
supabase/migrations/20250113000001_add_missing_rls_policies.sql
supabase/migrations/20250114000000_update_message_policies.sql
supabase/migrations/20250114000001_add_typing_indicator.sql
supabase/migrations/20250115000000_enhanced_messaging_schema.sql

-- 2. Filtering & payments
supabase/migrations/20250115200000_add_listing_filters.sql
supabase/migrations/20250115210000_add_stripe_payments.sql

-- 3. User creation & notifications
supabase/migrations/20250116000000_fix_user_creation.sql
supabase/migrations/20250116000001_add_notifications_and_tracking.sql
```

### Storage Setup

1. Go to Supabase Dashboard → Storage
2. Create a bucket named `listings`
3. Set bucket to **public** or configure RLS policies for signed URLs
4. Set max file size to 10MB

### RLS Policies

All tables have Row Level Security (RLS) enabled:
- **users:** Users can read all profiles, update only their own
- **listings:** Public read, authenticated insert, owner update/delete
- **messages:** Only participants can read/write
- **orders:** Only buyer and seller can view
- **reports:** Only reporter can view, admins can view all

---

## 🧪 Testing

### Automated Tests

```bash
# Test protected routes redirect correctly
node scripts/test-auth-protection.js

# Check listing images are accessible
npx ts-node scripts/check-listings.ts

# Run smoke tests
node scripts/smoke-test.js
```

### Manual QA Checklist

1. ✅ Sign up with .edu email
2. ✅ Create listing with images
3. ✅ View listing on mobile viewport
4. ✅ Send message to seller
5. ✅ Try to buy item (should show "payments disabled" message)
6. ✅ Admin: Export reports CSV
7. ✅ Test logout and login
8. ✅ Verify protected routes redirect to /login

---

## 🚀 Deployment

### Deploying to Vercel

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Production-ready deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables**
   - In Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.local`
   - Use **production** Supabase values
   - Keep `FEATURE_PAYMENTS_ENABLED=false`

4. **Deploy**
   ```bash
   # Vercel will auto-deploy on push to main
   # Or manually:
   vercel --prod
   ```

5. **Verify Deployment**
   - Check Vercel deployment URL
   - Test signup, listing creation, messaging
   - Verify images load correctly

### Custom Domain

1. In Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your domain
5. Update Stripe redirect URLs

---

## 💳 Enabling Payments

**⚠️ DO NOT enable payments until:**

1. ✅ LLC is formed and registered
2. ✅ Stripe account is fully activated (out of test mode)
3. ✅ Legal terms and privacy policy are in place
4. ✅ You have customer support infrastructure

### Steps to Enable Payments

1. **Activate Stripe Account**
   - Complete Stripe onboarding
   - Verify business details
   - Add bank account for payouts

2. **Switch to Live Keys**
   ```bash
   # In Vercel (or .env.local for local testing)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

3. **Set Up Production Webhook**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

4. **Enable Feature Flag**
   ```bash
   FEATURE_PAYMENTS_ENABLED=true
   ```

5. **Test in Production**
   - Use a real card (Stripe provides test cards even in live mode)
   - Complete a full purchase flow
   - Immediately refund the test transaction
   - Verify webhook processing

6. **Monitor Closely**
   - Watch Stripe Dashboard for transactions
   - Check Vercel logs for errors
   - Monitor Supabase for order creation

---

## 🔧 Operations

### Monitoring

**Logs:**
- Vercel: https://vercel.com/dashboard → Project → Logs
- Supabase: https://supabase.com/dashboard → Project → Logs
- Stripe: https://dashboard.stripe.com/logs

**Metrics:**
- Vercel Analytics (if enabled)
- Mixpanel (if configured)
- Supabase Database metrics

### Rollback Procedure

If issues occur after deployment:

**Option 1: Revert in Vercel**
1. Go to Vercel Dashboard → Deployments
2. Find previous stable deployment
3. Click "Promote to Production"

**Option 2: Git Revert**
```bash
git revert HEAD
git push origin main
# Vercel will auto-deploy the reverted version
```

### Common Issues

**Images not loading:**
- Check Supabase Storage bucket is public
- Verify image URLs are accessible
- Check `/api/listings/[id]/images` endpoint

**Auth issues:**
- Verify Supabase credentials in env vars
- Check browser console for Supabase errors
- Confirm email is .edu domain

**Payment errors:**
- Ensure `FEATURE_PAYMENTS_ENABLED=false` if not ready
- Check Stripe keys are correct
- Verify webhook secret matches Stripe

### Database Maintenance

**Backup:**
Supabase auto-backups daily. Manual backup:
```bash
# From Supabase Dashboard → Database → Backups
```

**Vacuum (optimize):**
```sql
-- Run monthly in Supabase SQL Editor
VACUUM ANALYZE;
```

---

## 📜 Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test:auth    # Test auth protection
npm run test:smoke   # Run smoke tests
npm run test:listings # Check listings

# Linting
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

Add these to `package.json`:
```json
{
  "scripts": {
    "test:auth": "node scripts/test-auth-protection.js",
    "test:smoke": "node scripts/smoke-test.js",
    "test:listings": "npx ts-node scripts/check-listings.ts"
  }
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

[Add your license here]

---

## 🆘 Support

- **Issues:** [GitHub Issues](your-repo/issues)
- **Email:** support@reclaimcampus.com
- **Discord:** [Community Link]

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Built with ❤️ for university students**
