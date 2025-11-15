# Enhanced Messaging System - Deployment Guide

## Current Issue: "Could not find the table 'public.conversations'"

This error occurs because the `conversations` table migration hasn't been applied to your Supabase database yet.

---

## 🚀 Quick Fix Steps

### Step 1: Apply Database Migration

The migration file already exists at `supabase/migrations/20250115000000_enhanced_messaging_schema.sql`. You need to apply it to your Supabase project.

#### Option A: Using Supabase Dashboard (Recommended for Production)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **+ New Query**
5. Copy the entire contents of `supabase/migrations/20250115000000_enhanced_messaging_schema.sql`
6. Paste into the SQL editor
7. Click **Run** button
8. Verify success - you should see "Success. No rows returned"

#### Option B: Using Supabase CLI (Recommended for Development)

```bash
# If you haven't initialized Supabase locally
npx supabase init

# Link to your remote project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to remote database
npx supabase db push

# Or run the specific migration
npx supabase db execute --file supabase/migrations/20250115000000_enhanced_messaging_schema.sql
```

**To find your PROJECT_REF:**
- Go to Supabase Dashboard > Project Settings > General
- Copy the "Reference ID"

### Step 2: Enable Realtime on Tables

After applying the migration, enable realtime replication:

1. In Supabase Dashboard, go to **Database** > **Replication**
2. Find and enable realtime for these tables:
   - ✅ `public.conversations`
   - ✅ `public.messages` (should already be enabled)
3. Click **Save**

### Step 3: Refresh Schema Cache

The schema cache needs to be refreshed so Supabase Realtime knows about the new table:

```bash
# Option 1: Using Supabase CLI
npx supabase db reset --linked

# Option 2: Restart Supabase services (Dashboard)
# Go to Settings > Database > Connection Pooling > Restart
```

Or simply **wait 2-5 minutes** - Supabase automatically refreshes the schema cache periodically.

### Step 4: Verify Tables Exist

Run this SQL query in your Supabase SQL Editor:

```sql
-- Check if conversations table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('conversations', 'messages');

-- Check conversations structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations';

-- Verify triggers exist
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table IN ('conversations', 'messages');
```

Expected results:
- 2 tables: `conversations`, `messages`
- Conversations columns: id, listing_id, participant_1_id, participant_2_id, last_message_id, last_message_at, participant_1_unread_count, participant_2_unread_count, created_at, updated_at
- 4 triggers on messages table

---

## 📋 Complete Database Schema

### Tables

#### `public.messages`
```sql
- id: UUID (PK)
- listing_id: UUID (FK → listings)
- sender_id: UUID (FK → users)
- receiver_id: UUID (FK → users)
- body: TEXT
- read: BOOLEAN
- delivered_at: TIMESTAMPTZ (auto-set on insert)
- seen_at: TIMESTAMPTZ (set when marked as read)
- edited: BOOLEAN
- deleted: BOOLEAN (soft delete)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ (auto-updated)
```

#### `public.conversations`
```sql
- id: UUID (PK)
- listing_id: UUID (FK → listings)
- participant_1_id: UUID (FK → users, lower UUID)
- participant_2_id: UUID (FK → users, higher UUID)
- last_message_id: UUID (FK → messages)
- last_message_at: TIMESTAMPTZ
- participant_1_unread_count: INTEGER
- participant_2_unread_count: INTEGER
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- UNIQUE(listing_id, participant_1_id, participant_2_id)
```

### Triggers

1. **`trigger_set_message_delivered_at`** (BEFORE INSERT on messages)
   - Auto-sets `delivered_at` timestamp when message is inserted
   - Sets `updated_at` to current time

2. **`trigger_update_message_updated_at`** (BEFORE UPDATE on messages)
   - Updates `updated_at` timestamp on any message edit

3. **`trigger_upsert_conversation_on_message`** (AFTER INSERT on messages)
   - Creates or updates conversation record
   - Increments unread count for receiver
   - Updates last_message_id and last_message_at

4. **`trigger_update_unread_on_message_read`** (BEFORE UPDATE on messages)
   - Decrements unread count when message.read changes from false to true
   - Sets `seen_at` timestamp
   - Updates conversation's updated_at

### Row Level Security (RLS) Policies

**Conversations:**
- `SELECT`: Users can view conversations they participate in
- `INSERT`: System-managed (via triggers)
- `UPDATE`: System-managed (via triggers)

**Messages:**
- Existing policies from previous migrations

---

## 🎯 Feature Implementation Details

### 1. Per-Conversation Unread Indicator (Red Dot)

**UI Behavior:**
- Show red dot (no number) on envelope icon in navbar when ANY conversation has unread messages
- Show red dot on individual conversations in chat list when that conversation has unread messages

**Data Source:**
```typescript
// In useConversations hook
const hasUnread = conversations.some(c => c.unreadCount > 0)

// For individual conversation
const showDot = conversation.unreadCount > 0
```

**Implementation:**
- Navbar: Display dot if `totalUnreadCount > 0`
- ChatList: Display dot per conversation if `conversation.unreadCount > 0`
- NO numeric display - only visual dot indicator

### 2. Mark-as-Read Behavior

**Trigger Conditions:**
- User opens conversation (conversation becomes selected)
- Document is visible (`document.visibilityState === 'visible'`)
- There are unread messages in the conversation

**Server-Side Update:**
```sql
UPDATE messages
SET
  read = true,
  seen_at = NOW()
WHERE listing_id = $1
  AND receiver_id = $2
  AND sender_id = $3
  AND read = false;
```

**Optimistic UI:**
1. Immediately set conversation.unreadCount = 0 in local state
2. Remove red dot from UI
3. Call server endpoint `/api/messages/mark-read`
4. If server fails, revert optimistic update and show error

**Debouncing (200-500ms):**
```typescript
const markAsReadDebounced = useMemo(
  () => debounce(markMessagesAsRead, 300),
  []
)

useEffect(() => {
  if (selectedConversation && document.visibilityState === 'visible') {
    markAsReadDebounced(selectedConversation.listingId, selectedConversation.otherUserId)
  }
}, [selectedConversation])
```

### 3. Real-time Sync

**Subscriptions:**

```typescript
// Subscribe to conversations table
supabase
  .channel('realtime:conversations')
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'conversations'
  }, (payload) => {
    // Refetch conversations to get updated unread counts
    fetchConversations()
  })

// Subscribe to messages table
supabase
  .channel('realtime:messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    // Add new message to state
    // Message will have delivered_at auto-set by trigger
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    // Update message in state (for edit, seen_at updates, etc.)
  })
```

**Avoiding Double-Handling:**
- Use temporary client IDs for optimistic messages
- When real message arrives via INSERT event, check if clientId matches
- If match found, replace optimistic message with real one (has server ID)
- If no match, it's a message from another user/device

```typescript
// When sending
const optimisticMessage = {
  id: `temp-${Date.now()}`,
  clientId: `temp-${Date.now()}`,
  // ... other fields
}

// On INSERT event
if (newMessage.clientId && existingMessages.some(m => m.clientId === newMessage.clientId)) {
  // Replace optimistic with real
  messages.map(m => m.clientId === newMessage.clientId ? newMessage : m)
} else {
  // New message from someone else
  messages.push(newMessage)
}
```

### 4. Long-Press / Right-Click Context Menu

**Desktop (Right-Click):**
```typescript
<div
  onContextMenu={(e) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setContextMenuVisible(true)
  }}
>
```

**Mobile (Long-Press ~500ms):**
```typescript
const handleTouchStart = (e) => {
  longPressTimer = setTimeout(() => {
    const touch = e.touches[0]
    setContextMenuPosition({ x: touch.clientX, y: touch.clientY })
    setContextMenuVisible(true)
  }, 500)
}

const handleTouchEnd = () => {
  clearTimeout(longPressTimer)
}
```

**Context Menu Actions:**
- **Edit**: Only for own messages, within 2-minute window
- **Delete**: Confirmation modal with two options
  - "Delete for me" (soft delete: `deleted = true` for you only)
  - "Delete for everyone" (if you're the sender, within time limit)

**Edit Time Limit:**
```typescript
const canEdit = (message) => {
  if (message.sender_id !== currentUserId) return false
  const messageAge = Date.now() - new Date(message.created_at).getTime()
  const TWO_MINUTES = 2 * 60 * 1000
  return messageAge <= TWO_MINUTES
}
```

### 5. Delivery & Seen Indicators

**Visual States:**

| State | delivered_at | seen_at | Visual | Tooltip |
|-------|-------------|---------|--------|---------|
| Sending | null | null | Spinner ⏳ | "Sending..." |
| Delivered | set | null | Single ✓ | "Delivered at HH:MM" |
| Seen | set | set | Double ✓✓ | "Seen at HH:MM" |

**Setting Timestamps:**

- `delivered_at`: Auto-set by database trigger on INSERT (server-side)
  - **Trade-off**: Server-side = reliable, single source of truth, no clock skew
  - Client doesn't need to worry about it

- `seen_at`: Set when mark-as-read is called (server-side via UPDATE)
  - Trigger sets it automatically when `read` changes from false to true

**Implementation:**
```typescript
const renderStatusIndicator = (message: Message) => {
  if (!message.delivered_at) {
    return <Spinner title="Sending..." />
  }

  if (message.seen_at) {
    return <DoubleCheck title={`Seen at ${formatTime(message.seen_at)}`} />
  }

  return <SingleCheck title={`Delivered at ${formatTime(message.delivered_at)}`} />
}
```

---

## 🔌 Server Endpoints

### POST /api/messages/mark-read

**Purpose:** Mark all messages in a conversation as read for the current user

**Payload:**
```typescript
{
  listingId: string (UUID)
  otherUserId: string (UUID)
}
```

**Server Logic:**
```typescript
// Use service role key for elevated permissions
const supabase = createClient(serviceRoleKey)

const { data, error } = await supabase
  .from('messages')
  .update({
    read: true
    // seen_at will be auto-set by trigger
  })
  .eq('listing_id', listingId)
  .eq('receiver_id', currentUserId)
  .eq('sender_id', otherUserId)
  .eq('read', false)

// Trigger automatically:
// - Sets seen_at = now()
// - Decrements conversation unread count
// - Broadcasts UPDATE event via realtime
```

**Response:**
```typescript
// Success
{ success: true, updatedCount: number }

// Error
{ error: string, code: string }
```

### POST /api/messages/send

**Purpose:** Send a new message (already implemented in enhanced-actions)

**Payload:**
```typescript
{
  listingId: string
  receiverId: string
  body: string
  clientId?: string // for optimistic update reconciliation
}
```

**Server Logic:**
- Insert message into database
- Trigger auto-sets `delivered_at`
- Trigger creates/updates conversation and increments unread count
- Realtime broadcasts INSERT event

### POST /api/messages/edit

**Purpose:** Edit message body

**Payload:**
```typescript
{
  messageId: string
  newBody: string
}
```

**Validation:**
- Must be message sender
- Message must be < 2 minutes old
- Message must not be deleted

**Server Logic:**
```typescript
const message = await supabase
  .from('messages')
  .select('sender_id, created_at, deleted')
  .eq('id', messageId)
  .single()

// Validate ownership
if (message.sender_id !== currentUserId) {
  return { error: 'Unauthorized' }
}

// Check time limit
const messageAge = Date.now() - new Date(message.created_at).getTime()
if (messageAge > 2 * 60 * 1000) {
  return { error: 'Edit window expired' }
}

// Update message
await supabase
  .from('messages')
  .update({
    body: newBody,
    edited: true
    // updated_at auto-set by trigger
  })
  .eq('id', messageId)
```

### POST /api/messages/delete

**Purpose:** Delete message (soft delete or hard delete)

**Payload:**
```typescript
{
  messageId: string
  deleteForEveryone: boolean
}
```

**Validation:**
- Must be message sender
- For `deleteForEveryone`, message must be recent (< 5 minutes)

**Server Logic:**
```typescript
if (deleteForEveryone) {
  // Hard delete (remove from all users' views)
  await supabase
    .from('messages')
    .update({ deleted: true })
    .eq('id', messageId)
} else {
  // Soft delete (client-side filtering for this user only)
  // Store in user preferences or separate table
}
```

---

## 🎣 Client Hooks

### useConversations()

**Purpose:** Manage list of conversations with real-time updates

**Returns:**
```typescript
{
  conversations: Conversation[]
  loading: boolean
  error: string | null
  totalUnreadCount: number
  refetch: () => Promise<void>
}
```

**Behavior:**
- Fetches conversations on mount
- Subscribes to `conversations` table changes
- Subscribes to `messages` INSERT events (to detect new conversations)
- Computes `totalUnreadCount` from all conversations
- Auto-refetches when realtime event received

**Usage:**
```typescript
const { conversations, totalUnreadCount, error } = useConversations()

// In Navbar
{totalUnreadCount > 0 && <RedDot />}

// In ChatList
{conversations.map(conv => (
  <ConversationItem
    key={conv.id}
    conversation={conv}
    showDot={conv.unreadCount > 0}
  />
))}
```

### useMessages(conversationId, otherUserId)

**Purpose:** Manage messages for a specific conversation

**Returns:**
```typescript
{
  messages: Message[]
  loading: boolean
  error: string | null
  sending: boolean
  sendMessage: (body: string) => Promise<void>
  editMessage: (id: string, newBody: string) => Promise<boolean>
  deleteMessage: (id: string, deleteForEveryone: boolean) => Promise<boolean>
  markAsRead: () => Promise<void>
  messagesEndRef: RefObject<HTMLDivElement>
}
```

**Behavior:**
- Fetches messages when conversation changes
- Subscribes to messages for this conversation
- Handles optimistic updates with client IDs
- Auto-scrolls to bottom on new messages
- Calls `markAsRead()` when conversation becomes visible

**Mark-as-Read Integration:**
```typescript
useEffect(() => {
  if (!conversationId || !otherUserId) return

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      markAsReadDebounced()
    }
  }

  // Mark on mount if visible
  if (document.visibilityState === 'visible') {
    markAsReadDebounced()
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [conversationId, otherUserId])
```

---

## 🎨 UI Components

### HeaderMessages (Navbar Integration)

**Current:** Shopping bag icon with numeric badge
**Target:** Envelope icon with red dot (no number)

```typescript
<Link href="/messages" className="relative">
  {/* Envelope Icon */}
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>

  {/* Red Dot (only when unread > 0) */}
  {totalUnreadCount > 0 && (
    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
          aria-label="You have unread messages" />
  )}
</Link>
```

### ChatList (Conversation Previews)

```typescript
<div className="divide-y">
  {conversations.map(conversation => (
    <button
      key={conversation.id}
      onClick={() => selectConversation(conversation)}
      className="w-full p-4 hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        {/* Listing Image */}
        <Image src={conversation.listing.image} />

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3>{conversation.listing.title}</h3>

            {/* Red Dot for unread */}
            {conversation.unreadCount > 0 && (
              <span className="w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>

          <p className="text-sm text-gray-600">
            {conversation.otherUser.name}
          </p>
          <p className="text-sm truncate">{conversation.lastMessage}</p>
        </div>
      </div>
    </button>
  ))}
</div>
```

### ConversationView (Messages + Composer)

```typescript
function ConversationView({ conversation }) {
  const { messages, sendMessage, markAsRead, messagesEndRef } =
    useMessages(conversation.listingId, conversation.otherUserId)

  // Auto mark-as-read when mounted and visible
  useEffect(() => {
    if (document.visibilityState === 'visible') {
      setTimeout(() => markAsRead(), 500) // Debounced
    }
  }, [conversation])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <MessageComposer onSend={sendMessage} />
    </div>
  )
}
```

### MessageBubble (with Context Menu)

Already implemented in `components/chat/MessageBubble.tsx` with:
- ✅ Long-press and right-click context menu
- ✅ Edit and delete actions
- ✅ Delivery/seen indicators
- ✅ Edit time limit (2 minutes)
- ✅ Confirmation for delete

---

## ⚠️ Error Handling

### Friendly Error Messages

```typescript
// In useConversations hook
if (error?.includes('conversations')) {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h3>Messages Unavailable</h3>
      <p>The messaging system needs to be set up. Please run database migrations.</p>
      <a href="https://github.com/YOUR_REPO/blob/main/MESSAGING_DEPLOYMENT_GUIDE.md">
        View Setup Guide →
      </a>
    </div>
  )
}
```

### Console Logging

```typescript
try {
  const result = await fetch('/api/messages/mark-read', {...})
  if (!result.ok) {
    console.error('[Messages] Mark-as-read failed:', await result.json())
  }
} catch (error) {
  console.error('[Messages] Network error:', error)
}
```

### Retry Behavior

```typescript
const fetchWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await sleep(1000 * Math.pow(2, i)) // Exponential backoff
    }
  }
}
```

---

## ✅ Testing Checklist

### Manual Testing Steps

#### 1. Sending Messages
- [ ] Send message from User A to User B
- [ ] Message appears in A's view with spinner → single check → double check
- [ ] Message appears in B's view immediately (realtime)
- [ ] B sees conversation with red dot
- [ ] Navbar shows red dot for B

#### 2. Receiving & Reading
- [ ] B opens conversation
- [ ] Red dot disappears from conversation item
- [ ] Red dot disappears from navbar (if no other unreads)
- [ ] Message shows double-check in A's view (seen indicator)
- [ ] `seen_at` timestamp appears in database

#### 3. Multi-Tab Consistency
- [ ] Open app in Tab 1 and Tab 2 (same user)
- [ ] Send message in Tab 1
- [ ] Tab 2 receives message via realtime
- [ ] Mark as read in Tab 2
- [ ] Tab 1 sees message marked as seen
- [ ] Both tabs show same unread count

#### 4. Long-Press Edit/Delete
- [ ] Long-press own message on mobile (500ms)
- [ ] Context menu appears
- [ ] Edit option available (if < 2 mins old)
- [ ] Click edit, modify text, save
- [ ] Message shows "(edited)" label
- [ ] Click delete, confirm dialog appears
- [ ] Message removed from view
- [ ] Database shows `deleted = true`

#### 5. Delivery/Seen Indicators
- [ ] Send message → shows spinner while sending
- [ ] On success → shows single check (delivered)
- [ ] Other user opens conversation → shows double check (seen)
- [ ] Hover over check marks → tooltip shows timestamp

#### 6. Page Reload Behavior
- [ ] Have unread messages
- [ ] Reload page
- [ ] Red dot still shows
- [ ] Unread count persists
- [ ] Open conversation
- [ ] Red dot clears
- [ ] Reload page
- [ ] Red dot stays cleared (persisted to DB)

#### 7. Visibility State
- [ ] Open conversation
- [ ] Switch to different tab (browser tab)
- [ ] Messages marked as read should NOT trigger (page not visible)
- [ ] Switch back to app tab
- [ ] Messages marked as read (page visible)

#### 8. Error Scenarios
- [ ] Disconnect internet
- [ ] Try to send message
- [ ] Error message appears
- [ ] Reconnect internet
- [ ] Message sends automatically (retry)
- [ ] Try to mark as read offline
- [ ] Error logged to console
- [ ] Reconnect and retry works

---

## 🚨 Common Issues & Solutions

### Issue: "Table 'conversations' does not exist"
**Solution:** Run the migration as described in Step 1 above

### Issue: "Realtime not receiving updates"
**Solution:**
1. Enable realtime replication in Supabase Dashboard
2. Restart Supabase services
3. Wait 2-5 minutes for schema cache refresh

### Issue: "Unread count doesn't decrement"
**Solution:** Check that the UPDATE trigger is firing:
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_unread_on_message_read';
```

### Issue: "Messages marked as read but still showing unread"
**Solution:**
1. Check browser console for errors
2. Verify mark-as-read endpoint is being called
3. Check database - is `read = true` and `seen_at` set?
4. Refetch conversations to sync state

### Issue: "Duplicate messages appearing"
**Solution:** Client ID reconciliation not working - check:
```typescript
// In realtime handler
const clientIdMatch = messages.find(m => m.clientId === newMessage.clientId)
if (clientIdMatch) {
  // Replace, don't add
}
```

---

## 📚 Additional Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)

---

## 🎯 Summary

This enhanced messaging system provides:
✅ Per-conversation unread tracking with red dot indicators
✅ Automatic mark-as-read with visibility awareness
✅ Real-time sync across devices and tabs
✅ Context menu for edit/delete with long-press and right-click
✅ Delivery and seen indicators with timestamps
✅ Robust error handling and retry logic
✅ Database triggers for automatic state management
✅ Comprehensive testing checklist

The migration is already written - you just need to apply it to your Supabase database following Step 1 above.
