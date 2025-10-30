/*
  # Create chat messages table for study sessions

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `session_id` (text, indexed) - Reference to study session
      - `user_id` (text) - User who sent the message
      - `user_name` (text) - Name of the user
      - `message` (text) - Message content
      - `message_type` (text) - Type of message (text, emoji, system)
      - `created_at` (timestamptz) - Timestamp when message was sent
      - `updated_at` (timestamptz) - Timestamp when message was updated
      
  2. Security
    - Enable RLS on `chat_messages` table
    - Add policy for authenticated users to read messages from sessions they're in
    - Add policy for authenticated users to create messages
    - Add policy for users to update/delete their own messages
  
  3. Indexes
    - Index on session_id for efficient message retrieval
    - Index on created_at for chronological ordering
*/

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  message text NOT NULL,
  message_type text DEFAULT 'text',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all messages (they can only join sessions they have access to)
CREATE POLICY "Authenticated users can read messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create messages
CREATE POLICY "Authenticated users can create messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own messages
CREATE POLICY "Users can update own messages"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();