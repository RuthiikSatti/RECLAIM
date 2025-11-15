# Enhanced Messaging System Documentation

## Overview

This document describes the production-ready enhanced messaging system implemented for the RECLAIM marketplace app. The system includes:

- **Per-conversation unread counts** with real-time updates
- **Delivery and seen status** tracking (single check = delivered, double check = seen)
- **Message editing** (within 2 minutes) and **deletion** with confirmation
- **Optimistic UI updates** for instant feedback
- **Context menus** (long-press on mobile, right-click on desktop)
- **Visibility-aware mark-as-read** (only marks read when page is visible)
- **Real-time synchronization** using Supabase Realtime
- **Race condition handling** for multiple tabs/devices

---

## Architecture

### Database Layer

**Tables:**
- `messages` - Stores all messages with delivery/seen tracking
- `conversations` - Stores conversation metadata and unread counts
- `users` - User profiles
- `listings` - Marketplace listings

**Key Features:**
- Automatic `delivered_at` timestamp on message insert
- Automatic `seen_at` timestamp when message marked as read
- Triggers to maintain unread counts in `conversations` table
- Soft delete for messages (`deleted` flag)
- Edit tracking (`edited` flag and `updated_at` timestamp)

### Server Layer (`lib/chat/enhanced-actions.ts`)

All server actions use **Supabase Service Role Key** for secure, reliable operations:

- `sendMessageEnhanced()` - Send message with delivery tracking
- `editMessageEnhanced()` - Edit message (2-minute window)
- `deleteMessageEnhanced()` - Soft delete message
- `markMessagesAsReadEnhanced()` - Mark messages read with seen timestamp
- `getConversationsEnhanced()` - Fetch conversations with unread counts
- `getMessagesEnhanced()` - Fetch messages for conversation
- `getTotalUnreadCountEnhanced()` - Get total unread count for user

**Security:** Service role key is NEVER exposed to client. All privileged operations go through server actions.

### Client Layer

**Hooks:**
- `useConversations()` - Manages conversations list with real-time updates
- `useMessages()` - Manages messages for a conversation with optimistic updates

**Components:**
- `MessageBubble` - Individual message with context menu and delivery indicators
- Chat components using the hooks

---

## Setup Instructions

### 1. Environment Variables

Add to `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# IMPORTANT: Service Role Key (Server-side only!)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**⚠️ WARNING:** Never expose the service role key to the client! It's only used in server actions.

### 2. Database Migration

Run the migration to add enhanced messaging features:

```bash
# Using Supabase CLI
supabase migration up

# Or manually run the SQL file in Supabase Dashboard:
# supabase/migrations/20250115000000_enhanced_messaging_schema.sql
```

This migration will:
- Add `delivered_at`, `seen_at`, `edited`, `deleted` columns to `messages`
- Create `conversations` table
- Set up triggers for auto-management
- Backfill existing data

### 3. Install Dependencies

The system uses existing dependencies. Ensure you have:

```bash
npm install @supabase/supabase-js
npm install @supabase/ssr
```

### 4. Verify RLS Policies

The migration includes RLS policies, but verify in Supabase Dashboard:

**Messages table:**
- Users can SELECT messages where they are sender OR receiver
- Users can INSERT messages (must be sender)
- Users can UPDATE messages where they are receiver OR sender
- Users can DELETE own messages (sender only)

**Conversations table:**
- Users can SELECT conversations where they are a participant
- System can INSERT/UPDATE conversations (managed by triggers)

---

## Usage Guide

### Using in Components

#### Example: Conversations List

```typescript
'use client'

import { useConversations } from '@/lib/hooks/useConversations'

export default function ChatList() {
  const { conversations, loading, error, refetch } = useConversations()

  if (loading) return <div>Loading conversations...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {conversations.map(conv => (
        <div key={conv.id} className="conversation-item">
          <div>{conv.otherUser.display_name}</div>
          <div>{conv.lastMessage}</div>
          {conv.unreadCount > 0 && (
            <span className="unread-badge">
              {conv.unreadCount}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
```

#### Example: Conversation View

```typescript
'use client'

import { useMessages } from '@/lib/hooks/useMessages'
import MessageBubble from '@/components/chat/MessageBubble'

export default function ConversationView({ listingId, otherUserId }) {
  const {
    messages,
    loading,
    sending,
    sendMessage,
    editMessage,
    deleteMessage,
    messagesEndRef
  } = useMessages(listingId, otherUserId)

  const [input, setInput] = useState('')

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    await sendMessage(input)
    setInput('')
  }

  return (
    <div className="conversation">
      <div className="messages">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwnMessage={msg.sender_id === currentUserId}
            onEdit={editMessage}
            onDelete={deleteMessage}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={sending}>
          Send
        </button>
      </form>
    </div>
  )
}
```

---

## Delivery & Seen Flow

### Timeline of a Message

1. **User sends message**
   - Optimistic update: Message appears immediately with spinner
   - Server action `sendMessageEnhanced()` called
   - Database trigger sets `delivered_at = NOW()`
   - Real-time event broadcasts to all subscribers

2. **Message delivered**
   - Single check (✓) appears for sender
   - Receiver sees message in their conversation
   - Conversation unread count increments

3. **Receiver opens conversation**
   - `useMessages` hook detects page visibility
   - Calls `markMessagesAsReadEnhanced()` after 1 second
   - Database trigger sets `seen_at = NOW()`
   - Unread count decrements
   - Real-time event broadcasts update

4. **Message seen**
   - Double check (✓✓) appears for sender
   - Tooltip shows "Seen at HH:MM"

### Indicator Visual Rules

```typescript
// Sending/Pending
!delivered_at → Spinner animation

// Delivered but not seen
delivered_at && !seen_at → Single check ✓

// Seen by recipient
seen_at → Double check ✓✓ with timestamp tooltip
```

---

## Real-time Subscriptions

### Conversations Channel

```typescript
supabase
  .channel('realtime:conversations')
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'conversations'
  }, (payload) => {
    // Handle conversation changes
  })
  .subscribe()
```

### Messages Channel (Per Conversation)

```typescript
supabase
  .channel(`messages:${listingId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `listing_id=eq.${listingId}`
  }, (payload) => {
    // Handle new messages
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'messages',
    filter: `listing_id=eq.${listingId}`
  }, (payload) => {
    // Handle message edits/reads
  })
  .subscribe()
```

### Avoiding Double-Handling

Optimistic updates use `clientId` to prevent duplicates:

```typescript
// When sending
const clientId = `client-${Date.now()}-${Math.random()}`
const optimisticMessage = { id: clientId, clientId, optimistic: true, ...}

// When real message arrives
setMessages(prev => {
  const exists = prev.some(m => m.id === newMessage.id || m.clientId === newMessage.clientId)
  if (exists) return prev // Skip duplicate
  return [...prev, newMessage]
})
```

---

## Testing

### Manual Test Plan

**Prerequisites:**
- Two test accounts with .edu emails
- Both logged in (use different browsers or incognito windows)

**Test 1: Send and Receive**
1. User A sends message to User B
2. ✅ User A sees optimistic message immediately
3. ✅ User A sees single check (✓) after delivery
4. ✅ User B sees conversation appear with unread badge
5. ✅ User B opens conversation
6. ✅ User A sees double check (✓✓) after User B opens
7. ✅ Unread badge disappears for User B

**Test 2: Edit Message**
1. User A sends message
2. User A right-clicks (or long-presses) message
3. User A selects "Edit"
4. ✅ Inline editor appears
5. User A edits and saves
6. ✅ Message updates in real-time for both users
7. ✅ "(edited)" label appears
8. Wait 2 minutes, try to edit again
9. ✅ Edit option shows "Can only edit within 2 minutes"

**Test 3: Delete Message**
1. User A sends message
2. User A right-clicks message
3. User A selects "Delete"
4. ✅ Confirmation dialog appears
5. User A confirms
6. ✅ Message disappears for both users immediately

**Test 4: Unread Counts**
1. User A sends 3 messages
2. ✅ User B sees "3" badge on conversation
3. User B opens conversation
4. ✅ Badge fades out smoothly
5. ✅ Badge disappears after animation

**Test 5: Multiple Tabs**
1. User A opens conversation in two browser tabs
2. User A sends message in Tab 1
3. ✅ Message appears in both tabs
4. User B opens conversation
5. ✅ Both of User A's tabs see double check

**Test 6: Visibility Detection**
1. User B opens conversation
2. User B switches to another browser tab
3. User A sends message
4. ✅ Unread count does NOT decrement yet
5. User B switches back to conversation tab
6. ✅ Messages are marked read
7. ✅ User A sees double check

**Test 7: Network Errors**
1. Disable internet on User A's device
2. User A sends message
3. ✅ Optimistic message appears
4. Re-enable internet
5. ✅ Message delivers with check mark
6. ✅ No duplicates appear

---

### SQL Testing Queries

**Check message status:**
```sql
SELECT
  id,
  body,
  sender_id,
  receiver_id,
  read,
  delivered_at,
  seen_at,
  edited,
  deleted,
  created_at,
  updated_at
FROM messages
WHERE listing_id = 'YOUR_LISTING_ID'
ORDER BY created_at DESC
LIMIT 20;
```

**Check conversation unread counts:**
```sql
SELECT
  c.*,
  l.title AS listing_title,
  u1.display_name AS participant_1_name,
  u2.display_name AS participant_2_name
FROM conversations c
JOIN listings l ON l.id = c.listing_id
JOIN users u1 ON u1.id = c.participant_1_id
JOIN users u2 ON u2.id = c.participant_2_id
WHERE c.participant_1_id = 'YOUR_USER_ID'
   OR c.participant_2_id = 'YOUR_USER_ID'
ORDER BY c.last_message_at DESC;
```

**Validate unread count accuracy:**
```sql
-- Check if stored count matches actual unread messages
WITH actual_counts AS (
  SELECT
    listing_id,
    receiver_id,
    COUNT(*) AS unread_count
  FROM messages
  WHERE read = false AND deleted = false
  GROUP BY listing_id, receiver_id
)
SELECT
  c.id AS conversation_id,
  c.participant_1_id,
  c.participant_1_unread_count AS stored_p1_count,
  COALESCE(ac1.unread_count, 0) AS actual_p1_count,
  c.participant_2_id,
  c.participant_2_unread_count AS stored_p2_count,
  COALESCE(ac2.unread_count, 0) AS actual_p2_count
FROM conversations c
LEFT JOIN actual_counts ac1
  ON ac1.listing_id = c.listing_id
  AND ac1.receiver_id = c.participant_1_id
LEFT JOIN actual_counts ac2
  ON ac2.listing_id = c.listing_id
  AND ac2.receiver_id = c.participant_2_id
WHERE c.participant_1_unread_count != COALESCE(ac1.unread_count, 0)
   OR c.participant_2_unread_count != COALESCE(ac2.unread_count, 0);
-- Should return 0 rows if counts are accurate
```

---

## Edge Cases & Race Conditions

### Handled Scenarios

1. **Multiple tabs sending simultaneously**
   - Each message gets unique `clientId`
   - Deduplication by ID and clientId
   - Optimistic messages replaced with real ones

2. **Network interruption during send**
   - Optimistic message shows with spinner
   - On reconnect, real message arrives
   - Optimistic message replaced
   - If error, optimistic message removed

3. **Rapid open/close of conversation**
   - Mark-as-read is debounced
   - Uses `hasMarkedReadRef` to prevent duplicate calls
   - Only marks when visibility state is 'visible'

4. **Message edited while other user viewing**
   - Real-time UPDATE event broadcasts edit
   - Both users see updated message
   - "(edited)" indicator appears

5. **Message deleted while other user typing reply**
   - Soft delete sets `deleted = true`
   - Real-time DELETE event broadcasts
   - Message filtered from both sides
   - References remain for conversation history

6. **User A marks read, User B sends message immediately**
   - Triggers handle increments atomically
   - Unread count accurate via SQL constraints
   - Real-time events keep UI in sync

---

## Accessibility Features

- **Keyboard navigation** for context menus
- **ARIA labels** on all interactive elements
- **Focus management** in edit mode
- **Screen reader support** with semantic HTML
- **Escape key** closes context menu and edit mode
- **Enter key** saves edits
- **Tab navigation** through menu items

---

## Performance Optimizations

1. **Indexed columns**: delivered_at, seen_at, deleted
2. **Efficient queries**: Use conversations table for unread counts instead of counting messages
3. **Optimistic updates**: Instant UI feedback
4. **Debounced mark-as-read**: Prevents spam
5. **Selective subscriptions**: Only listen to relevant conversations
6. **Automatic cleanup**: Channels unsubscribed on unmount

---

## Troubleshooting

### Messages not delivering

**Check:**
1. Supabase service role key is set in `.env.local`
2. RLS policies allow user to insert messages
3. Network tab shows successful POST to `/api/...`
4. Console for JavaScript errors

### Unread counts not updating

**Check:**
1. Triggers are installed: `SELECT * FROM pg_trigger WHERE tgname LIKE '%message%'`
2. Run validation SQL query (see Testing section)
3. Check Supabase logs for trigger errors

### Real-time not working

**Check:**
1. Supabase Realtime is enabled for the project
2. Tables have `REPLICA IDENTITY FULL`: `ALTER TABLE messages REPLICA IDENTITY FULL;`
3. Console shows subscription status = "SUBSCRIBED"
4. No adblockers blocking WebSocket connections

### Seen status not updating

**Check:**
1. Page visibility API supported: `console.log(document.visibilityState)`
2. User has actually opened the conversation (not just hovered)
3. markMessagesAsReadEnhanced returns success
4. seen_at timestamp is being set in database

---

## Firebase Alternative

To use Firebase instead of Supabase:

1. **Database**: Use Firestore with collections: `conversations`, `messages`
2. **Real-time**: Use `onSnapshot()` instead of `postgres_changes`
3. **Triggers**: Use Cloud Functions instead of SQL triggers
4. **Auth**: Use Firebase Auth instead of Supabase Auth
5. **Security**: Use Firestore Security Rules instead of RLS

**Key differences:**
- Firestore has no JOIN support - denormalize data
- Cloud Functions are separate deployments
- Real-time subscriptions work similarly
- Security rules syntax is different

---

## Future Enhancements

- [ ] Message reactions (emoji)
- [ ] Message forwarding
- [ ] Typing indicators
- [ ] Voice messages
- [ ] File attachments
- [ ] Message search
- [ ] Thread replies
- [ ] Message pinning
- [ ] Read receipts toggle (user privacy)
- [ ] Block/mute users

---

## Support

For issues or questions:
1. Check console for errors
2. Review Supabase logs
3. Run SQL validation queries
4. Check this README's troubleshooting section

---

## License

This enhanced messaging system is part of the RECLAIM project.
