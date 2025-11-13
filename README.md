# Reclaim MVP - Campus Marketplace

Reclaim is a campus-only marketplace for verified students to buy and sell items safely within their university community.

## Tech Stack

- **Frontend & Backend**: Next.js 15 with TypeScript and App Router
- **Database & Auth**: Supabase (PostgreSQL, Authentication, Storage, Realtime)
- **Styling**: Tailwind CSS
- **Analytics**: Mixpanel
- **Hosting**: Vercel

## Features

- .edu-only email verification for sign up
- User authentication with Supabase
- Create, edit, and delete listings with image uploads
- Browse marketplace with search and category filters
- Real-time chat between buyers and sellers using Supabase Realtime
- Report/flag inappropriate listings
- Admin moderation panel for managing reports
- Analytics tracking with Mixpanel (signup, create_listing, view_listing, send_message)

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- A Mixpanel account and project (optional)
- A Vercel account (for deployment)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd RECLAIM
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Run the SQL migrations in the Supabase SQL Editor:
   - Execute `supabase/schema.sql` to create tables
   - Execute `supabase/rls-policies.sql` to set up Row Level Security
   - Execute `supabase/storage.sql` to create the storage bucket

### 4. Configure environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mixpanel Configuration (optional)
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# Vercel URL (auto-populated in Vercel)
NEXT_PUBLIC_VERCEL_URL=
```

You can find your Supabase credentials in:
- Project Settings > API > Project URL (NEXT_PUBLIC_SUPABASE_URL)
- Project Settings > API > Project API keys > anon public (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Project Settings > API > Project API keys > service_role (SUPABASE_SERVICE_ROLE_KEY) ⚠️ Keep this secret!

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Test the application

1. Sign up with a .edu email address
2. Verify your email (check spam folder)
3. Sign in and create a test listing
4. Browse the marketplace
5. Test the chat feature
6. Try reporting a listing
7. Check the admin panel at `/admin`

## Project Structure

```
RECLAIM/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin moderation panel
│   ├── create/            # Create listing page
│   ├── item/[id]/         # Listing detail page
│   ├── login/             # Login page
│   ├── marketplace/       # Marketplace page
│   ├── profile/[id]/      # User profile page
│   └── signup/            # Signup page
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── analytics/        # Analytics components
│   ├── chat/             # Chat components
│   ├── layout/           # Layout components
│   └── listings/         # Listing components
├── lib/                   # Utility libraries
│   ├── auth/             # Authentication actions
│   ├── chat/             # Chat actions
│   ├── listings/         # Listing actions
│   ├── mixpanel/         # Mixpanel configuration
│   ├── reports/          # Report actions
│   ├── supabase/         # Supabase clients
│   └── utils/            # Helper functions
├── supabase/             # Database migrations
│   ├── schema.sql        # Table definitions
│   ├── rls-policies.sql  # Security policies
│   └── storage.sql       # Storage bucket config
└── types/                # TypeScript type definitions
```

## Database Schema

### users
- id (uuid, primary key)
- email (text, unique)
- display_name (text)
- university_domain (text)
- created_at (timestamp)

### listings
- id (uuid, primary key)
- user_id (uuid, foreign key)
- title (text)
- description (text)
- category (text)
- price (integer, in cents)
- image_urls (text array)
- created_at (timestamp)

### messages
- id (uuid, primary key)
- listing_id (uuid, foreign key)
- sender_id (uuid, foreign key)
- receiver_id (uuid, foreign key)
- body (text)
- created_at (timestamp)

### reports
- id (uuid, primary key)
- reporter_id (uuid, foreign key)
- listing_id (uuid, foreign key)
- reason (text)
- status (text: pending | resolved | dismissed)
- created_at (timestamp)

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Project Settings > Environment Variables
4. Deploy!

### Option 2: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts to deploy your application.

## Mixpanel Events

The app tracks the following events:

- **signup_success**: When a user successfully creates an account
- **create_listing**: When a user creates a new listing
- **view_listing**: When a user views a listing detail page
- **send_message**: When a user sends a message

## Security Notes

- ⚠️ Never commit `.env.local` or expose your `SUPABASE_SERVICE_ROLE_KEY`
- Row Level Security (RLS) is enabled on all tables
- Only authenticated users can create listings and send messages
- Users can only edit/delete their own listings
- Admin operations use the service role key on the server side

## Known Limitations (MVP)

- Admin access is not role-based (uses service role key)
- No email notifications for messages
- No payment integration
- No in-app image editing
- Limited to 5 images per listing

## Future Enhancements

- Role-based admin authentication
- Email notifications for new messages
- Payment integration (Stripe, PayPal)
- User ratings and reviews
- Advanced search with filters
- Mobile app (React Native)
- Push notifications

## Support

For issues or questions, please open an issue on GitHub.

## License

This project is licensed under the MIT License.
