-- ============================================================================
-- Update Elements to Reference Questions (Migration 014)
-- ============================================================================
-- This migration updates the feedback_elements table to reference questions instead of modules

-- Step 1: Add question_id column (nullable initially)
ALTER TABLE feedback_elements ADD COLUMN IF NOT EXISTS question_id UUID REFERENCES feedback_questions(id) ON DELETE CASCADE;

-- Step 2: Create index for question_id
CREATE INDEX IF NOT EXISTS idx_feedback_elements_question_id ON feedback_elements(question_id);

-- Step 3: Create index for position sorting within question
CREATE INDEX IF NOT EXISTS idx_feedback_elements_question_position ON feedback_elements(question_id, position);

-- Note: Existing data migration would go here if needed
-- For now, elements without question_id will still reference module_id directly
-- The application will need to handle both cases during the transition
