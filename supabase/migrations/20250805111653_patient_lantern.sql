/*
  # Create missing tables and functions

  1. New Tables
    - `quests` - User quest tracking system
    - `messages` - Alternative message storage (if needed)
    - `conversations` - Conversation grouping
    - `annotations` - Data annotation storage

  2. Functions
    - Update existing functions to handle new schema
    - Add quest management functions

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Create quests table
CREATE TABLE IF NOT EXISTS public.quests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    quest_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table (alternative to chat_messages if needed)
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'lumi')),
    conversation_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    path TEXT NOT NULL DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create annotations table
CREATE TABLE IF NOT EXISTS public.annotations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message_id BIGINT,
    annotation_data JSONB NOT NULL DEFAULT '{}',
    annotation_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to users table
DO $$
BEGIN
    -- Add silver_keys column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'silver_keys'
    ) THEN
        ALTER TABLE users ADD COLUMN silver_keys INTEGER DEFAULT 0;
    END IF;

    -- Add gold_keys column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'gold_keys'
    ) THEN
        ALTER TABLE users ADD COLUMN gold_keys INTEGER DEFAULT 0;
    END IF;

    -- Add last_emotion column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_emotion'
    ) THEN
        ALTER TABLE users ADD COLUMN last_emotion TEXT;
    END IF;

    -- Add familiarization_completed column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'familiarization_completed'
    ) THEN
        ALTER TABLE users ADD COLUMN familiarization_completed BOOLEAN DEFAULT false;
    END IF;

    -- Add familiarization_completed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'familiarization_completed_at'
    ) THEN
        ALTER TABLE users ADD COLUMN familiarization_completed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add familiarization_answers column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'familiarization_answers'
    ) THEN
        ALTER TABLE users ADD COLUMN familiarization_answers TEXT[];
    END IF;

    -- Add primary_path column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'primary_path'
    ) THEN
        ALTER TABLE users ADD COLUMN primary_path TEXT;
    END IF;

    -- Add motivation_level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'motivation_level'
    ) THEN
        ALTER TABLE users ADD COLUMN motivation_level INTEGER;
    END IF;

    -- Add main_challenges column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'main_challenges'
    ) THEN
        ALTER TABLE users ADD COLUMN main_challenges TEXT[];
    END IF;

    -- Add support_needs column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'support_needs'
    ) THEN
        ALTER TABLE users ADD COLUMN support_needs TEXT[];
    END IF;
END $$;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON public.quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_completed ON public.quests(completed);
CREATE INDEX IF NOT EXISTS idx_quests_path ON public.quests(path);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON public.annotations(user_id);

-- Enable Row Level Security (RLS) on new tables
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quests table
CREATE POLICY "Users can view own quests"
  ON public.quests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quests"
  ON public.quests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests"
  ON public.quests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quests"
  ON public.quests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for messages table
CREATE POLICY "Users can view own messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for conversations table
CREATE POLICY "Users can view own conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for annotations table
CREATE POLICY "Users can view own annotations"
  ON public.annotations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own annotations"
  ON public.annotations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates on new tables
CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON public.quests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create quest management functions
CREATE OR REPLACE FUNCTION get_user_active_quests(user_uuid UUID)
RETURNS TABLE (
    id BIGINT,
    path TEXT,
    quest_id INTEGER,
    text TEXT,
    points INTEGER,
    completed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT q.id, q.path, q.quest_id, q.text, q.points, q.completed
    FROM quests q
    WHERE q.user_id = user_uuid AND q.completed = false
    ORDER BY q.id DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user statistics function to include quest data
CREATE OR REPLACE FUNCTION get_user_statistics(user_uuid UUID)
RETURNS jsonb AS $$
DECLARE
    stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_messages', (
            SELECT count(*) FROM chat_messages 
            WHERE user_id = user_uuid
        ),
        'messages_this_week', (
            SELECT count(*) FROM chat_messages 
            WHERE user_id = user_uuid 
            AND timestamp > now() - interval '7 days'
        ),
        'completed_quests', (
            SELECT count(*) FROM quests 
            WHERE user_id = user_uuid AND completed = true
        ),
        'active_quests', (
            SELECT count(*) FROM quests 
            WHERE user_id = user_uuid AND completed = false
        ),
        'total_points', (
            SELECT COALESCE(points, 0) FROM users WHERE id = user_uuid
        ),
        'current_level', (
            SELECT COALESCE(level, 1) FROM users WHERE id = user_uuid
        ),
        'days_active', (
            SELECT count(DISTINCT date_trunc('day', timestamp))
            FROM chat_messages 
            WHERE user_id = user_uuid
        ),
        'favorite_path', (
            SELECT path FROM chat_messages 
            WHERE user_id = user_uuid 
            GROUP BY path 
            ORDER BY count(*) DESC 
            LIMIT 1
        ),
        'progress_percentage', (
            SELECT CASE 
                WHEN COALESCE(points, 0) = 0 THEN 0
                ELSE LEAST(100, (COALESCE(points, 0)::float / 1000) * 100)
            END
            FROM users WHERE id = user_uuid
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on new tables
GRANT ALL ON public.quests TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.annotations TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;