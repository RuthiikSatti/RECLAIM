-- Enhanced Messaging Schema with Delivery/Seen Tracking
-- This migration enhances the existing messages table and adds conversations table

-- ============================================================================
-- 1. ADD DELIVERY/SEEN TRACKING TO MESSAGES TABLE
-- ============================================================================

-- Add new columns to existing messages table
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Add indices for performance
CREATE INDEX IF NOT EXISTS messages_delivered_at_idx ON public.messages(delivered_at);
CREATE INDEX IF NOT EXISTS messages_seen_at_idx ON public.messages(seen_at);
CREATE INDEX IF NOT EXISTS messages_deleted_idx ON public.messages(deleted) WHERE deleted = false;

-- ============================================================================
-- 2. CREATE CONVERSATIONS TABLE
-- ============================================================================

-- Conversations table to track per-conversation metadata
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings ON DELETE CASCADE NOT NULL,
  participant_1_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  participant_2_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  last_message_id UUID REFERENCES public.messages ON DELETE SET NULL NULL,
  last_message_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  participant_1_unread_count INTEGER DEFAULT 0 NOT NULL,
  participant_2_unread_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Ensure unique conversation per listing + participant pair (regardless of order)
  CONSTRAINT unique_conversation UNIQUE (listing_id, participant_1_id, participant_2_id)
);

-- Indices for conversations
CREATE INDEX IF NOT EXISTS conversations_listing_id_idx ON public.conversations(listing_id);
CREATE INDEX IF NOT EXISTS conversations_participant_1_id_idx ON public.conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS conversations_participant_2_id_idx ON public.conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON public.conversations(last_message_at DESC);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view conversations they participate in"
  ON public.conversations FOR SELECT
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "System can insert conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (true); -- Will be managed by triggers

CREATE POLICY "System can update conversations"
  ON public.conversations FOR UPDATE
  USING (true); -- Will be managed by triggers

-- ============================================================================
-- 3. FUNCTION: AUTO-SET DELIVERED_AT ON MESSAGE INSERT
-- ============================================================================

-- Function to set delivered_at when message is inserted
CREATE OR REPLACE FUNCTION set_message_delivered_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set delivered_at to now when message is first created
  NEW.delivered_at = timezone('utc'::text, now());
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set delivered_at
DROP TRIGGER IF EXISTS trigger_set_message_delivered_at ON public.messages;
CREATE TRIGGER trigger_set_message_delivered_at
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_delivered_at();

-- ============================================================================
-- 4. FUNCTION: UPDATE MESSAGE UPDATED_AT ON EDIT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on message edit
DROP TRIGGER IF EXISTS trigger_update_message_updated_at ON public.messages;
CREATE TRIGGER trigger_update_message_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_updated_at();

-- ============================================================================
-- 5. FUNCTION: UPSERT CONVERSATION ON MESSAGE INSERT
-- ============================================================================

-- Function to create or update conversation when message is sent
CREATE OR REPLACE FUNCTION upsert_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_participant_1 UUID;
  v_participant_2 UUID;
  v_conversation_id UUID;
BEGIN
  -- Skip if message is deleted
  IF NEW.deleted THEN
    RETURN NEW;
  END IF;

  -- Order participants consistently (lower UUID first)
  IF NEW.sender_id < NEW.receiver_id THEN
    v_participant_1 := NEW.sender_id;
    v_participant_2 := NEW.receiver_id;
  ELSE
    v_participant_1 := NEW.receiver_id;
    v_participant_2 := NEW.sender_id;
  END IF;

  -- Upsert conversation
  INSERT INTO public.conversations (
    listing_id,
    participant_1_id,
    participant_2_id,
    last_message_id,
    last_message_at,
    participant_1_unread_count,
    participant_2_unread_count
  )
  VALUES (
    NEW.listing_id,
    v_participant_1,
    v_participant_2,
    NEW.id,
    NEW.created_at,
    CASE WHEN NEW.receiver_id = v_participant_1 AND NOT NEW.read THEN 1 ELSE 0 END,
    CASE WHEN NEW.receiver_id = v_participant_2 AND NOT NEW.read THEN 1 ELSE 0 END
  )
  ON CONFLICT (listing_id, participant_1_id, participant_2_id)
  DO UPDATE SET
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    -- Increment unread count for receiver if message is unread
    participant_1_unread_count = CASE
      WHEN NEW.receiver_id = v_participant_1 AND NOT NEW.read
      THEN public.conversations.participant_1_unread_count + 1
      ELSE public.conversations.participant_1_unread_count
    END,
    participant_2_unread_count = CASE
      WHEN NEW.receiver_id = v_participant_2 AND NOT NEW.read
      THEN public.conversations.participant_2_unread_count + 1
      ELSE public.conversations.participant_2_unread_count
    END,
    updated_at = timezone('utc'::text, now())
  RETURNING id INTO v_conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to upsert conversation on message insert
DROP TRIGGER IF EXISTS trigger_upsert_conversation_on_message ON public.messages;
CREATE TRIGGER trigger_upsert_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION upsert_conversation_on_message();

-- ============================================================================
-- 6. FUNCTION: DECREMENT UNREAD COUNT WHEN MESSAGE MARKED READ
-- ============================================================================

CREATE OR REPLACE FUNCTION update_unread_on_message_read()
RETURNS TRIGGER AS $$
DECLARE
  v_participant_1 UUID;
  v_participant_2 UUID;
BEGIN
  -- Only process if read status changed from false to true
  IF OLD.read = false AND NEW.read = true THEN
    -- Order participants consistently
    IF NEW.sender_id < NEW.receiver_id THEN
      v_participant_1 := NEW.sender_id;
      v_participant_2 := NEW.receiver_id;
    ELSE
      v_participant_1 := NEW.receiver_id;
      v_participant_2 := NEW.sender_id;
    END IF;

    -- Set seen_at timestamp when marked as read
    NEW.seen_at = timezone('utc'::text, now());

    -- Decrement unread count for the receiver
    UPDATE public.conversations
    SET
      participant_1_unread_count = CASE
        WHEN NEW.receiver_id = v_participant_1
        THEN GREATEST(participant_1_unread_count - 1, 0)
        ELSE participant_1_unread_count
      END,
      participant_2_unread_count = CASE
        WHEN NEW.receiver_id = v_participant_2
        THEN GREATEST(participant_2_unread_count - 1, 0)
        ELSE participant_2_unread_count
      END,
      updated_at = timezone('utc'::text, now())
    WHERE listing_id = NEW.listing_id
      AND participant_1_id = v_participant_1
      AND participant_2_id = v_participant_2;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update unread count when message is read
DROP TRIGGER IF EXISTS trigger_update_unread_on_message_read ON public.messages;
CREATE TRIGGER trigger_update_unread_on_message_read
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_on_message_read();

-- ============================================================================
-- 7. FUNCTION: COMPUTE UNREAD COUNT (QUERY-BASED ALTERNATIVE)
-- ============================================================================

-- Function to compute unread count for a user in a conversation
-- Use this if you prefer query-based counts over stored counters
CREATE OR REPLACE FUNCTION get_conversation_unread_count(
  p_listing_id UUID,
  p_user_id UUID,
  p_other_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.messages
  WHERE listing_id = p_listing_id
    AND receiver_id = p_user_id
    AND sender_id = p_other_user_id
    AND read = false
    AND deleted = false;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. HELPER FUNCTION: GET USER'S UNREAD COUNT FOR CONVERSATION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_unread_count_for_conversation(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_conv RECORD;
BEGIN
  SELECT participant_1_id, participant_2_id, participant_1_unread_count, participant_2_unread_count
  INTO v_conv
  FROM public.conversations
  WHERE id = p_conversation_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_conv.participant_1_id = p_user_id THEN
    v_count := v_conv.participant_1_unread_count;
  ELSIF v_conv.participant_2_id = p_user_id THEN
    v_count := v_conv.participant_2_unread_count;
  ELSE
    v_count := 0;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. BACKFILL EXISTING DATA (OPTIONAL - RUN ONCE)
-- ============================================================================

-- Backfill conversations from existing messages
-- This will create conversation records for all existing message threads
DO $$
DECLARE
  v_msg RECORD;
  v_participant_1 UUID;
  v_participant_2 UUID;
BEGIN
  -- Create conversations from existing messages
  FOR v_msg IN (
    SELECT DISTINCT
      listing_id,
      sender_id,
      receiver_id
    FROM public.messages
    WHERE deleted = false
  ) LOOP
    -- Order participants consistently
    IF v_msg.sender_id < v_msg.receiver_id THEN
      v_participant_1 := v_msg.sender_id;
      v_participant_2 := v_msg.receiver_id;
    ELSE
      v_participant_1 := v_msg.receiver_id;
      v_participant_2 := v_msg.sender_id;
    END IF;

    -- Insert conversation if it doesn't exist
    INSERT INTO public.conversations (
      listing_id,
      participant_1_id,
      participant_2_id,
      last_message_at
    )
    SELECT
      v_msg.listing_id,
      v_participant_1,
      v_participant_2,
      MAX(m.created_at)
    FROM public.messages m
    WHERE m.listing_id = v_msg.listing_id
      AND ((m.sender_id = v_participant_1 AND m.receiver_id = v_participant_2)
        OR (m.sender_id = v_participant_2 AND m.receiver_id = v_participant_1))
      AND m.deleted = false
    GROUP BY v_msg.listing_id
    ON CONFLICT (listing_id, participant_1_id, participant_2_id) DO NOTHING;
  END LOOP;

  -- Update unread counts for existing conversations
  UPDATE public.conversations c
  SET
    participant_1_unread_count = (
      SELECT COUNT(*)::INTEGER
      FROM public.messages m
      WHERE m.listing_id = c.listing_id
        AND m.receiver_id = c.participant_1_id
        AND m.sender_id = c.participant_2_id
        AND m.read = false
        AND m.deleted = false
    ),
    participant_2_unread_count = (
      SELECT COUNT(*)::INTEGER
      FROM public.messages m
      WHERE m.listing_id = c.listing_id
        AND m.receiver_id = c.participant_2_id
        AND m.sender_id = c.participant_1_id
        AND m.read = false
        AND m.deleted = false
    );

  RAISE NOTICE 'Backfill complete';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE public.conversations IS 'Stores metadata for message conversations including unread counts';
COMMENT ON COLUMN public.messages.delivered_at IS 'Timestamp when message was delivered to database';
COMMENT ON COLUMN public.messages.seen_at IS 'Timestamp when recipient marked message as read';
COMMENT ON COLUMN public.messages.edited IS 'Flag indicating if message was edited after sending';
COMMENT ON COLUMN public.messages.deleted IS 'Soft delete flag for messages';
