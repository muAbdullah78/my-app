-- Create enum for message status
CREATE TYPE message_status AS ENUM (
  'sent',
  'delivered',
  'read'
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(shop_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status message_status DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create message attachments table
CREATE TABLE message_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Shop owners can view their shop conversations"
  ON conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = conversations.shop_id
    AND shops.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = conversations.shop_id
        AND shops.owner_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = conversations.shop_id
        AND shops.owner_id = auth.uid()
      )
    )
  ));

-- Message attachments policies
CREATE POLICY "Users can view attachments in their conversations"
  ON message_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM messages
    JOIN conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = message_attachments.message_id
    AND (
      conversations.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = conversations.shop_id
        AND shops.owner_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can add attachments to their messages"
  ON message_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM messages
    JOIN conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = message_attachments.message_id
    AND (
      conversations.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = conversations.shop_id
        AND shops.owner_id = auth.uid()
      )
    )
  ));

-- Create triggers for updating timestamps
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update conversation's last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message(); 