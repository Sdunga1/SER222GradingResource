# Site Lock Feature Migration

## To enable the site lock feature, run this migration:

### Option 1: Using your existing migration system
If you have a migration system set up, include `database/migrations/016_create_site_settings.sql`

### Option 2: Run directly with psql
```bash
psql your_database_url -f database/migrations/016_create_site_settings.sql
```

### Option 3: Run via Vercel/Production Database UI
Execute these SQL statements in order:

```sql
-- Create site settings table
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
```

## After Migration

Once the migration is complete, the "Lock Website" button will appear in Editor mode in the Module Management Controls section.

## How It Works

1. **Lock Website Button**: In Editor mode, you'll see a "Lock Website" / "Unlock Website" button
2. **Global Lock**: When locked, ALL users (across all devices/browsers) will be required to enter the passcode
3. **Database Persistence**: Lock status is stored in the database, so it persists across all instances
4. **Auto-Check**: The app checks lock status every 10 seconds, so users will be locked out within 10 seconds of you locking the site
5. **Unlock**: When you unlock, users who were previously authenticated can continue (but need to refresh)
