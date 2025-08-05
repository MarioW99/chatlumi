-- Seed data for Chat Me application

-- Insert default agents
INSERT INTO public.agents (name, type, configuration) VALUES
('Lumi', 'main', '{"personality": "empathic, supportive, and encouraging", "expertise": "general wellness, motivation, and personal growth", "tone": "warm and understanding"}'),
('Lumi (Fitness Coach)', 'fitness', '{"personality": "energetic, motivating, and results-oriented", "expertise": "physical fitness, strength training, cardio, and exercise planning", "tone": "enthusiastic and encouraging"}'),
('Lumi (Nutrition Guide)', 'nutrition', '{"personality": "nurturing, knowledgeable, and health-focused", "expertise": "nutrition science, meal planning, healthy eating habits", "tone": "caring and informative"}'),
('Lumi (Mental Wellness)', 'mental-strength', '{"personality": "wise, empathetic, and calming", "expertise": "mental health, stress management, mindfulness, emotional intelligence", "tone": "gentle and supportive"}')
ON CONFLICT DO NOTHING;

-- Insert sample user progress data (for testing)
INSERT INTO public.user_progress (user_id, path, level, experience_points, achievements) VALUES
('00000000-0000-0000-0000-000000000001', 'fitness', 2, 150, '["first_workout", "consistency_streak"]'),
('00000000-0000-0000-0000-000000000001', 'nutrition', 1, 50, '["first_meal_plan"]'),
('00000000-0000-0000-0000-000000000001', 'mental-strength', 1, 25, '["first_mindfulness_session"]')
ON CONFLICT DO NOTHING;

-- Insert sample chat messages (for testing)
INSERT INTO public.chat_messages (user_id, sender, content, path, emotion, timestamp) VALUES
('00000000-0000-0000-0000-000000000001', 'user', 'Hello Lumi! I want to start my fitness journey.', 'fitness', 'excited', NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000001', 'lumi', 'Welcome to your fitness journey! I''m excited to help you build strength and endurance. What''s your current fitness level?', 'fitness', 'enthusiastic', NOW() - INTERVAL '1 hour' + INTERVAL '30 seconds'),
('00000000-0000-0000-0000-000000000001', 'user', 'I''m a beginner, but I''m motivated to get stronger.', 'fitness', 'determined', NOW() - INTERVAL '30 minutes'),
('00000000-0000-0000-0000-000000000001', 'lumi', 'Perfect! Starting as a beginner is the best approach. Let''s create a plan that builds your strength gradually and safely.', 'fitness', 'supportive', NOW() - INTERVAL '30 minutes' + INTERVAL '15 seconds')
ON CONFLICT DO NOTHING;

-- Insert sample user sessions (for testing)
INSERT INTO public.user_sessions (user_id, session_start, session_end, messages_count, paths_visited) VALUES
('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 4, ARRAY['fitness']),
('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 minutes', NOW(), 2, ARRAY['fitness'])
ON CONFLICT DO NOTHING; 