# Deployment Guide - Unified Messages Inbox Update

## What's New

This update adds a unified messages inbox to the Reclaim marketplace app with the following features:

- **Messages Inbox Page** at `/messages` - View all conversations in one place
- **Unread Message Notifications** - Badge in navbar showing unread count
- **Message Read/Unread Tracking** - Messages automatically mark as read when viewed
- **Conversation Previews** - See last message and listing details for each conversation

## Database Migration Required

**IMPORTANT:** This update requires a database migration to add the `read` field to the messages table.

### Step 1: Run the Migration

You have two options:

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250113000000_add_read_field_to_messages.sql`
4. Click "Run"

#### Option B: Via Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase migration up
```

### Step 2: Verify the Migration

Run this query in your Supabase SQL Editor to verify:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
```

You should see a `read` column with type `boolean` and default `false`.

## Deployment Steps

### 1. Update Your Code

Pull the latest changes:

```bash
git pull origin main
```

### 2. Install Dependencies (if needed)

```bash
npm install
```

### 3. Run the Database Migration

Follow the steps in "Database Migration Required" section above.

### 4. Test Locally

```bash
npm run dev
```

Test the following:
- Go to `/messages` - should load without errors
- Send a message to a listing
- Check that the navbar badge updates
- Open the messages page and verify conversations appear
- Click on a conversation and verify messages load
- Send a message and verify real-time updates work

### 5. Deploy to Production

#### If using Vercel:

Vercel will automatically deploy when you push to GitHub. No additional steps needed.

```bash
git push origin main
```

#### If using another platform:

Follow your platform's deployment process. Make sure to:
- Pull latest code
- Run `npm install`
- Run `npm run build`
- Restart your application

## Troubleshooting

### Error: "column messages.read does not exist"

**Cause:** The database migration hasn't been run yet.

**Solution:** Run the migration SQL in your Supabase dashboard (see Step 1 above).

### Messages page shows "No messages yet" but I have messages

**Cause:** The messages might not have associated listing data.

**Solution:** Check your messages table in Supabase and ensure `listing_id` references exist in the listings table.

### Unread count shows 0 but I have unread messages

**Cause:** Migration was run but existing messages are marked as read.

**Solution:** Run this SQL to reset existing messages to unread:

```sql
UPDATE public.messages SET read = false WHERE receiver_id = 'YOUR_USER_ID';
```

Replace `'YOUR_USER_ID'` with your actual user ID.

### Real-time updates not working

**Cause:** Supabase Realtime might not be enabled for the messages table.

**Solution:**
1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for the `messages` table
3. Refresh your application

## Files Changed

This update modified the following files:

- `app/messages/page.tsx` (NEW) - Messages inbox page
- `components/layout/Navbar.tsx` - Already had unread badge (no changes needed)
- `lib/chat/actions.ts` - Added `markMessagesAsRead()` function, updated `getAllConversations()`
- `types/database.ts` - Added `read`, `receiver`, and `listing` fields to Message interface
- `supabase/schema.sql` - Added `read` field to messages table definition
- `supabase/migrations/20250113000000_add_read_field_to_messages.sql` (NEW) - Migration file
- `projectplan.md` - Updated to reflect new features

## Rollback Instructions

If you need to rollback this update:

### 1. Revert Code Changes

```bash
git revert HEAD
git push origin main
```

### 2. Remove Database Column (Optional)

**WARNING:** This will delete the read status of all messages.

```sql
ALTER TABLE public.messages DROP COLUMN IF EXISTS read;
```

## Support

If you encounter any issues during deployment:

1. Check the Troubleshooting section above
2. Review Supabase logs in your dashboard
3. Check browser console for JavaScript errors
4. Verify environment variables are set correctly

## Next Steps After Deployment

1. Test the messages inbox with real users
2. Monitor Mixpanel events for `send_message` to track usage
3. Consider adding email notifications for new messages (future enhancement)
4. Gather user feedback on the messaging experience
