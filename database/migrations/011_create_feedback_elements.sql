-- ============================================================================
-- Create Feedback Elements Table (Migration 011)
-- ============================================================================
-- This table stores individual feedback comments/elements within modules
-- Each element is a reusable comment that graders can copy

CREATE TABLE IF NOT EXISTS feedback_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES feedback_modules(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for finding elements by module
CREATE INDEX IF NOT EXISTS idx_feedback_elements_module_id ON feedback_elements(module_id);

-- Add index for position sorting within module
CREATE INDEX IF NOT EXISTS idx_feedback_elements_module_position ON feedback_elements(module_id, position);

-- Add trigger for automatic updated_at
CREATE TRIGGER update_feedback_elements_updated_at BEFORE UPDATE ON feedback_elements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
