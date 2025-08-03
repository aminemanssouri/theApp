-- Migration for direct messaging between clients and workers
-- Add recipient_id column to messages table

-- Check if recipient_id column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'recipient_id'
  ) THEN
    -- Add recipient_id column if it doesn't exist
    ALTER TABLE messages 
    ADD COLUMN recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster querying of direct messages
CREATE INDEX IF NOT EXISTS idx_messages_direct_messaging 
ON messages(sender_id, recipient_id);

-- Create function to retrieve direct messages between two users
CREATE OR REPLACE FUNCTION get_direct_messages(user1_id UUID, user2_id UUID)
RETURNS SETOF messages AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM messages
  WHERE (sender_id = user1_id AND recipient_id = user2_id) OR
        (sender_id = user2_id AND recipient_id = user1_id)
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for direct messages
-- Allow users to see direct messages where they are sender or recipient
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view direct messages they're part of"
  ON messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  );

CREATE POLICY "Users can insert direct messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );
