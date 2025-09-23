-- Migration: Add AI enhancement storage to topics table
-- Date: 2025-01-22
-- Description: Add JSONB column for storing AI enhancement context and content

-- Add the AI generated content column to topics table
ALTER TABLE topics ADD COLUMN ai_generated_content JSONB;

-- Add the extracted fields for easy access (following session pattern)
ALTER TABLE topics ADD COLUMN learning_outcomes TEXT;
ALTER TABLE topics ADD COLUMN trainer_notes TEXT;
ALTER TABLE topics ADD COLUMN materials_needed TEXT;
ALTER TABLE topics ADD COLUMN delivery_guidance TEXT;

-- Create GIN index for efficient JSONB queries
CREATE INDEX idx_topics_ai_content ON topics USING GIN (ai_generated_content);

-- Create indexes for the extracted fields
CREATE INDEX idx_topics_learning_outcomes ON topics (learning_outcomes);
CREATE INDEX idx_topics_trainer_notes ON topics (trainer_notes);

-- Add comments for documentation
COMMENT ON COLUMN topics.ai_generated_content IS 'Stores full AI enhancement data including context, metadata, and structured content';
COMMENT ON COLUMN topics.learning_outcomes IS 'Extracted learning outcomes for easy access and queries';
COMMENT ON COLUMN topics.trainer_notes IS 'Extracted trainer preparation and delivery notes';
COMMENT ON COLUMN topics.materials_needed IS 'Extracted list of required materials and resources';
COMMENT ON COLUMN topics.delivery_guidance IS 'Extracted delivery format and timing guidance';