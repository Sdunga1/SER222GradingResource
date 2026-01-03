-- ============================================================================
-- Make module_id nullable in feedback_elements (Migration 015)
-- ============================================================================
-- Since elements now belong to questions (which belong to modules),
-- we don't need module_id to be NOT NULL anymore

ALTER TABLE feedback_elements ALTER COLUMN module_id DROP NOT NULL;

-- Drop the old index on module_id since we're using question_id now
DROP INDEX IF EXISTS idx_feedback_elements_module_id;
DROP INDEX IF EXISTS idx_feedback_elements_module_position;
