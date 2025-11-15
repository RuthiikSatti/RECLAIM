-- Drop existing update policy for messages
DROP POLICY IF EXISTS "Users can update messages where they are receiver" ON public.messages;

-- Create updated policies to allow senders to edit and delete messages
CREATE POLICY "Users can update messages where they are receiver or sender"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);
