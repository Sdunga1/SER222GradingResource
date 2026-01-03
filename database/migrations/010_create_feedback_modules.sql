-- ============================================================================
-- Create Feedback Modules Table (Migration 010)
-- ============================================================================
-- This table stores feedback modules that contain reusable comments/elements
-- for grading. Used by both Editor Mode (create/edit) and Grader Mode (view/copy)

CREATE TABLE IF NOT EXISTS feedback_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for position sorting
CREATE INDEX IF NOT EXISTS idx_feedback_modules_position ON feedback_modules(position);

-- Add trigger for automatic updated_at
CREATE TRIGGER update_feedback_modules_updated_at BEFORE UPDATE ON feedback_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
