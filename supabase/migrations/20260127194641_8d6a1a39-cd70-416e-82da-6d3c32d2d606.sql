-- Create direct_messages table for direct messaging between users
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view messages where they are sender or receiver
CREATE POLICY "Users can view their direct messages"
ON public.direct_messages
FOR SELECT
USING (
  (sender_id = auth.uid() OR receiver_id = auth.uid())
  AND entreprise_id = get_user_entreprise_id(auth.uid())
);

-- RLS: Users can send messages to users in the same entreprise
CREATE POLICY "Users can send direct messages"
ON public.direct_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND entreprise_id = get_user_entreprise_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = receiver_id
    AND entreprise_id = get_user_entreprise_id(auth.uid())
  )
);

-- RLS: Users can mark messages as read when they are the receiver
CREATE POLICY "Users can update read status"
ON public.direct_messages
FOR UPDATE
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;