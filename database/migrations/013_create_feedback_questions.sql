-- ============================================================================
-- Create Feedback Questions Table (Migration 013)
-- ============================================================================
-- This table adds a question layer between modules and elements
-- Modules contain questions, and questions contain elements (comments)

CREATE TABLE IF NOT EXISTS feedback_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES feedback_modules(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for finding questions by module
CREATE INDEX IF NOT EXISTS idx_feedback_questions_module_id ON feedback_questions(module_id);

-- Add index for position sorting within module
CREATE INDEX IF NOT EXISTS idx_feedback_questions_module_position ON feedback_questions(module_id, position);

-- Add trigger for automatic updated_at
CREATE TRIGGER update_feedback_questions_updated_at BEFORE UPDATE ON feedback_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
