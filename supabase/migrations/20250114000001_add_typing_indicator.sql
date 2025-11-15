-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(listing_id, user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS typing_indicators_listing_id_idx ON public.typing_indicators(listing_id);
CREATE INDEX IF NOT EXISTS typing_indicators_user_id_idx ON public.typing_indicators(user_id);

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view typing indicators in their conversations"
  ON public.typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages
      WHERE messages.listing_id = typing_indicators.listing_id
      AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert typing indicators"
  ON public.typing_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own typing indicators"
  ON public.typing_indicators FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-delete old typing indicators (older than 5 seconds)
-- This will be handled by the client for simplicity
