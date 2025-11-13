-- Migration: Add read field to messages table
-- This migration adds message read/unread tracking functionality
-- Run this in your Supabase SQL Editor or via CLI

-- Add read field to messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'messages'
    AND column_name = 'read'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN read boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- All existing messages will default to unread (false)
-- This is intentional to notify users of historical messages
