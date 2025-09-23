-- Leadership Training App - Enhanced Sample Data
-- Story 1.2: Database Schema & Roles

-- Clean existing sample data (keep structure)
DELETE FROM topic_coaching_tips;
DELETE FROM session_topics;
DELETE FROM registrations;
DELETE FROM coaching_tips;
DELETE FROM sessions;
DELETE FROM incentives;
DELETE FROM users WHERE email LIKE '%@example.com';

-- Create realistic users for each role
INSERT INTO users (id, email, password_hash, role_id, is_active) VALUES
    -- Content Developers
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'sarah.content@company.com', '$2b$10$example.hash.for.development.only', 2, true),
    ('b2c3d4e5-f6a7-8901-2345-678901bcdefb', 'mike.creator@company.com', '$2b$10$example.hash.for.development.only', 2, true),

    -- Trainers
    ('c3d4e5f6-a7b8-9012-3456-789012cdefca', 'john.trainer@company.com', '$2b$10$example.hash.for.development.only', 3, true),
    ('d4e5f6a7-b8c9-0123-4567-890123defcda', 'lisa.coach@company.com', '$2b$10$example.hash.for.development.only', 3, true),

    -- Brokers
    ('e5f6a7b8-c9d0-1234-5678-901234efabea', 'broker1@company.com', '$2b$10$example.hash.for.development.only', 1, true),
    ('f6a7b8c9-d0e1-2345-6789-012345fabcfa', 'broker2@company.com', '$2b$10$example.hash.for.development.only', 1, true);

-- Ensure trainer emails align with intended user accounts without duplicates
UPDATE trainers SET email = 'john.trainer@company.com' WHERE name = 'John Smith';
-- Keep Sarah Johnson's original email to avoid conflicts
UPDATE trainers SET email = 'sarah.johnson@company.com' WHERE name = 'Sarah Johnson';
-- Insert Lisa Chen with a unique email; ignore if already present
INSERT INTO trainers (name, email, bio, is_active) VALUES
    ('Lisa Chen', 'lisa.coach@company.com', 'Executive Leadership Coach with expertise in organizational development', true)
ON CONFLICT (email) DO NOTHING;

-- Create comprehensive coaching tips
INSERT INTO coaching_tips (text, category, difficulty_level, created_by_user_id, is_active) VALUES
    ('Start each meeting by clearly stating the objectives and expected outcomes. This helps keep discussions focused and productive.', 'Meeting Management', 'beginner', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', true),
    ('Use the 80/20 rule for decision making: spend 80% of your time listening and 20% talking. This builds trust and ensures you have all the information before deciding.', 'Decision Making', 'intermediate', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', true),
    ('When delivering difficult feedback, use the SBI model: Situation, Behavior, Impact. This keeps the conversation objective and actionable.', 'Feedback', 'intermediate', 'b2c3d4e5-f6a7-8901-2345-678901bcdefb', true),
    ('Implement regular one-on-one check-ins with your team members. Consistency builds trust and helps you stay connected to their challenges and growth.', 'Team Management', 'beginner', 'c3d4e5f6-a7b8-9012-3456-789012cdefca', true),
    ('Practice strategic patience: not every problem needs immediate action. Sometimes the best leadership decision is to wait and gather more information.', 'Strategic Thinking', 'advanced', 'b2c3d4e5-f6a7-8901-2345-678901bcdefb', true),
    ('Create psychological safety by admitting your own mistakes first. This encourages team members to be open about challenges and failures.', 'Team Building', 'intermediate', 'd4e5f6a7-b8c9-0123-4567-890123defcda', true),
    ('Use the "Yes, and..." technique from improv to build on ideas rather than shutting them down. This fosters innovation and collaboration.', 'Communication', 'beginner', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', true),
    ('Delegate authority, not just tasks. Give team members the power to make decisions within defined boundaries to develop their leadership skills.', 'Delegation', 'advanced', 'c3d4e5f6-a7b8-9012-3456-789012cdefca', true);

-- Link coaching tips to relevant topics
INSERT INTO topic_coaching_tips (topic_id, tip_id) VALUES
    (1, 1), (1, 4), (1, 6), -- Leadership Fundamentals
    (2, 7), (2, 1), (2, 3), -- Team Communication
    (3, 3), (3, 6), -- Conflict Resolution
    (4, 2), (4, 5), (4, 8); -- Strategic Planning

-- Create realistic training sessions with various statuses
INSERT INTO sessions (id, title, description, start_time, end_time, status, author_id, location_id, trainer_id, audience_id, tone_id, category_id, max_registrations, ai_prompt, ai_generated_content, is_active) VALUES
    -- Published sessions
    ('11111111-1111-1111-1111-111111111111',
     'Leadership Fundamentals Workshop',
     'A comprehensive introduction to core leadership principles, covering communication, decision-making, and team building essentials for new managers.',
     '2025-09-25 09:00:00', '2025-09-25 12:00:00', 'published',
     'a1b2c3d4-e5f6-7890-1234-567890abcdef', 1, 1, 1, 1, 1, 25,
     'Create engaging content for a leadership fundamentals workshop targeting new managers. Focus on practical skills and interactive exercises.',
     'Join us for an engaging 3-hour workshop designed specifically for new managers! Learn essential leadership skills through interactive exercises, real-world case studies, and peer collaboration. Take your leadership journey to the next level!',
     true),

    ('22222222-2222-2222-2222-222222222222',
     'Advanced Strategic Planning Intensive',
     'Deep dive into strategic thinking, long-term planning methodologies, and execution frameworks for senior leaders.',
     '2025-09-28 13:00:00', '2025-09-28 17:00:00', 'published',
     'b2c3d4e5-f6a7-8901-2345-678901bcdefb', 2, 2, 2, 3, 1, 15,
     'Develop content for an advanced strategic planning session for senior leaders. Emphasize frameworks, case studies, and actionable strategies.',
     'Transform your strategic thinking in this intensive 4-hour session! Senior leaders will master proven frameworks for long-term planning, learn from real business case studies, and develop actionable strategies for organizational success.',
     true),

    -- Draft sessions
    ('33333333-3333-3333-3333-333333333333',
     'Effective Team Communication',
     'Building stronger teams through improved communication practices, active listening, and conflict resolution.',
     '2025-10-02 10:00:00', '2025-10-02 13:00:00', 'draft',
     'a1b2c3d4-e5f6-7890-1234-567890abcdef', 1, 3, 3, 2, 2, 30,
     NULL, NULL, true),

    ('44444444-4444-4444-4444-444444444444',
     'Conflict Resolution Masterclass',
     'Advanced techniques for managing workplace conflicts, difficult conversations, and team dynamics.',
     '2025-10-05 14:00:00', '2025-10-05 16:30:00', 'draft',
     'b2c3d4e5-f6a7-8901-2345-678901bcdefb', 2, 1, 2, 1, 1, 20,
     NULL, NULL, true),

    -- Completed session
    ('55555555-5555-5555-5555-555555555555',
     'New Manager Bootcamp',
     'Intensive program covering all aspects of transitioning from individual contributor to manager.',
     '2025-09-15 09:00:00', '2025-09-15 17:00:00', 'completed',
     'a1b2c3d4-e5f6-7890-1234-567890abcdef', 1, 1, 1, 4, 1, 20,
     'Create comprehensive content for a full-day new manager bootcamp. Cover transition challenges, key skills, and practical tools.',
     'Successfully completed! This intensive full-day program equipped 18 new managers with essential leadership skills, practical tools, and confidence to lead their teams effectively. Excellent feedback from all participants!',
     true);

-- Link sessions to topics (many-to-many relationships)
INSERT INTO session_topics (session_id, topic_id) VALUES
    ('11111111-1111-1111-1111-111111111111', 1), -- Leadership Fundamentals -> Leadership Fundamentals
    ('11111111-1111-1111-1111-111111111111', 2), -- Leadership Fundamentals -> Team Communication
    ('22222222-2222-2222-2222-222222222222', 4), -- Strategic Planning -> Strategic Planning
    ('33333333-3333-3333-3333-333333333333', 2), -- Team Communication -> Team Communication
    ('44444444-4444-4444-4444-444444444444', 3), -- Conflict Resolution -> Conflict Resolution
    ('55555555-5555-5555-5555-555555555555', 1), -- New Manager Bootcamp -> Leadership Fundamentals
    ('55555555-5555-5555-5555-555555555555', 2); -- New Manager Bootcamp -> Team Communication

-- Create realistic registrations for published sessions
INSERT INTO registrations (id, session_id, name, email, phone, referred_by, sync_status, sync_attempts, external_id, notes) VALUES
    -- Leadership Fundamentals Workshop registrations
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Alex Rodriguez', 'alex.rodriguez@company.com', '555-0101', 'HR Department', 'synced', 1, 'EXT001', 'Recently promoted team lead'),
    ('11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Emma Thompson', 'emma.thompson@company.com', '555-0102', 'Direct Manager', 'synced', 1, 'EXT002', 'New to management role'),
    ('11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'David Chen', 'david.chen@company.com', '555-0103', NULL, 'pending', 0, NULL, 'Self-registered'),
    ('11111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'Maria Garcia', 'maria.garcia@company.com', NULL, 'Colleague', 'synced', 1, 'EXT003', 'Cross-department transfer'),

    -- Strategic Planning Intensive registrations
    ('22222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Robert Kim', 'robert.kim@company.com', '555-0201', 'Executive Team', 'synced', 1, 'EXT004', 'Department head'),
    ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Jennifer Wong', 'jennifer.wong@company.com', '555-0202', NULL, 'failed', 2, NULL, 'Sync issues - retry needed'),
    ('22222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 'Michael Brown', 'michael.brown@company.com', '555-0203', 'Director', 'synced', 1, 'EXT005', 'Strategic planning lead');

-- Create sample incentives
INSERT INTO incentives (id, title, description, rules, start_date, end_date, status, author_id, ai_generated_content, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111',
     'Early Bird Registration Discount',
     'Save 20% on all leadership training sessions when you register at least 2 weeks in advance.',
     'Valid for registrations made 14+ days before session start date. Cannot be combined with other offers. Maximum 1 use per person per quarter.',
     '2025-09-01 00:00:00', '2025-12-31 23:59:59', 'published',
     'a1b2c3d4-e5f6-7890-1234-567890abcdef',
     '🚀 Don''t miss out! Register early and save 20% on transformative leadership training. Invest in your growth and your team''s success. Limited time offer - the best leaders plan ahead!',
     true),

    ('22222222-2222-2222-2222-222222222222',
     'Team Builder Bundle',
     'Bring your entire team! Register 5+ people for any session and get the 6th registration free.',
     'Minimum 5 registrations from same department/team required. Free registration must be of equal or lesser value. Valid through end of quarter.',
     '2025-09-15 00:00:00', '2025-12-31 23:59:59', 'draft',
     'b2c3d4e5-f6a7-8901-2345-678901bcdefb',
     NULL,
     true);

-- Update system settings with sample data info
INSERT INTO system_settings (key, value, description) VALUES
    ('sample_data_version', '1.2.0', 'Enhanced sample data with relationships'),
    ('total_sample_users', '6', 'Number of sample users created'),
    ('total_sample_sessions', '5', 'Number of sample sessions created'),
    ('total_sample_registrations', '7', 'Number of sample registrations created')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;
