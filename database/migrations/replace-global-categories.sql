-- Migration: Replace Global Categories
-- Description: Remove existing categories and insert new Primerica-focused categories
-- Date: 2025-10-13

-- Start transaction
BEGIN;

-- Remove existing categories (this will cascade to set category_id to NULL in sessions table)
DELETE FROM categories;

-- Insert new Primerica-focused categories
INSERT INTO categories (name, description, is_active, created_at, updated_at)
VALUES
    -- Core Development
    ('Mindset', 'Training that builds belief, confidence, and motivation to succeed.', true, NOW(), NOW()),
    ('Prospecting', 'Finding and connecting with new clients and recruits.', true, NOW(), NOW()),
    ('Sales Basics', 'Learning how to explain concepts and guide clients through simple presentations.', true, NOW(), NOW()),
    ('Recruiting', 'How to invite, present, and build a growing team.', true, NOW(), NOW()),
    ('Leadership', 'Developing trainers, leaders, and duplicating success.', true, NOW(), NOW()),
    ('Business Systems', 'Running your agency like a business — organization, habits, and planning.', true, NOW(), NOW()),
    ('Closing', 'Turning conversations into confident action and business results.', true, NOW(), NOW()),
    ('Recognition', 'Celebrating wins, events, and building a strong team culture.', true, NOW(), NOW()),
    ('Client Care', 'Keeping clients connected through reviews, follow-ups, and referrals.', true, NOW(), NOW()),
    ('Orientation', 'Understanding Primerica''s mission, vision, and business model.', true, NOW(), NOW()),

    -- Product & Financial Training
    ('Life Insurance', 'Protecting families through term insurance and needs analysis.', true, NOW(), NOW()),
    ('Investments', 'Teaching how to invest the difference and grow wealth long-term.', true, NOW(), NOW()),
    ('Debt Solutions', 'Helping families eliminate debt and improve cash flow.', true, NOW(), NOW()),
    ('Protection', 'Safeguarding income and assets through proper planning.', true, NOW(), NOW()),
    ('Retirement', 'Preparing clients for retirement through savings and investment plans.', true, NOW(), NOW());

-- Commit transaction
COMMIT;

-- Verification query (optional - can be run separately to verify)
-- SELECT id, name, description, is_active, created_at FROM categories ORDER BY name;