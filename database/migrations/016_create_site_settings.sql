-- Create site settings table for global configurations
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default lock setting
INSERT INTO site_settings (key, value) VALUES ('site_locked', 'false')
ON CONFLICT (key) DO NOTHING;

-- Create trigger to update updated_at
CREATE TRIGGER update_site_settings_updated_at 
    BEFORE UPDATE ON site_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
