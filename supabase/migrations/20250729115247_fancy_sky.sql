/*
  # Fix timestamp types and improve database schema

  1. Schema Updates
    - Convert all timestamp columns to `timestamp with time zone` for proper timezone handling
    - Add missing indexes for better query performance
    - Add proper constraints and defaults

  2. Security Improvements
    - Review and strengthen RLS policies
    - Add audit triggers for sensitive operations
    - Improve data validation constraints

  3. Performance Optimizations
    - Add composite indexes for common query patterns
    - Optimize existing indexes
*/

-- Fix timestamp types to include timezone information
ALTER TABLE users 
  ALTER COLUMN created_at TYPE timestamp with time zone,
  ALTER COLUMN last_active TYPE timestamp with time zone,
  ALTER COLUMN familiarization_completed_at TYPE timestamp with time zone;

ALTER TABLE chat_messages 
  ALTER COLUMN timestamp TYPE timestamp with time zone;

ALTER TABLE messages 
  ALTER COLUMN created_at TYPE timestamp with time zone;

ALTER TABLE conversations 
  ALTER COLUMN created_at TYPE timestamp with time zone;

ALTER TABLE annotations 
  ALTER COLUMN created_at TYPE timestamp with time zone;

ALTER TABLE agents 
  ALTER COLUMN created_at TYPE timestamp with time zone;

-- Add missing constraints and improve data integrity
ALTER TABLE users 
  ADD CONSTRAINT users_level_positive CHECK (level > 0),
  ADD CONSTRAINT users_points_non_negative CHECK (points >= 0),
  ADD CONSTRAINT users_silver_keys_non_negative CHECK (silver_keys >= 0),
  ADD CONSTRAINT users_gold_keys_non_negative CHECK (gold_keys >= 0),
  ADD CONSTRAINT users_motivation_level_range CHECK (motivation_level >= 1 AND motivation_level <= 10);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_path ON chat_messages(user_id, path);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Add composite index for common chat queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_path_timestamp 
  ON chat_messages(user_id, path, timestamp DESC);

-- Improve RLS policies for better security
DROP POLICY IF EXISTS "Users can read own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;

-- More restrictive and specific RLS policies
CREATE POLICY "Users can read own chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND content IS NOT NULL AND trim(content) != '');

CREATE POLICY "Users can update own recent chat messages"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND timestamp > now() - interval '1 hour')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recent chat messages"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND timestamp > now() - interval '24 hours');

-- Improve users table RLS
DROP POLICY IF EXISTS "Enable users to view their own data only" ON users;

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND email IS NOT NULL);

-- Add audit trigger for sensitive user data changes
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log important profile changes
  IF OLD.familiarization_completed != NEW.familiarization_completed OR
     OLD.primary_path != NEW.primary_path OR
     OLD.level != NEW.level THEN
    
    INSERT INTO user_audit_log (
      user_id,
      changed_fields,
      old_values,
      new_values,
      changed_at
    ) VALUES (
      NEW.id,
      ARRAY['familiarization_completed', 'primary_path', 'level'],
      jsonb_build_object(
        'familiarization_completed', OLD.familiarization_completed,
        'primary_path', OLD.primary_path,
        'level', OLD.level
      ),
      jsonb_build_object(
        'familiarization_completed', NEW.familiarization_completed,
        'primary_path', NEW.primary_path,
        'level', NEW.level
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  changed_fields text[],
  old_values jsonb,
  new_values jsonb,
  changed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own audit log"
  ON user_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create the trigger
DROP TRIGGER IF EXISTS user_changes_audit ON users;
CREATE TRIGGER user_changes_audit
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_changes();

-- Add function to clean old chat messages (for GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void AS $$
BEGIN
  -- Delete chat messages older than 1 year
  DELETE FROM chat_messages 
  WHERE timestamp < now() - interval '1 year';
  
  -- Delete audit logs older than 2 years
  DELETE FROM user_audit_log 
  WHERE changed_at < now() - interval '2 years';
END;
$$ LANGUAGE plpgsql;

-- Add quest management functions
CREATE OR REPLACE FUNCTION get_user_active_quests(user_uuid uuid)
RETURNS TABLE (
  id integer,
  path text,
  quest_id integer,
  text text,
  points integer,
  completed boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.path, q.quest_id, q.text, q.points, q.completed
  FROM quests q
  WHERE q.user_id = user_uuid AND q.completed = false
  ORDER BY q.id DESC;
END;
$$ LANGUAGE plpgsql;

-- Add user statistics function
CREATE OR REPLACE FUNCTION get_user_statistics(user_uuid uuid)
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
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;