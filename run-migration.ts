// Quick migration runner for site_settings table
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    console.log('\nCreating site_settings table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    console.log('✅ Table created/verified');
    
    console.log('\nInserting default lock setting...');
    await pool.query(`
      INSERT INTO site_settings (key, value) VALUES ('site_locked', 'false')
      ON CONFLICT (key) DO NOTHING
    `);
    
    console.log('✅ Default setting inserted');
    
    console.log('\nCreating/verifying trigger...');
    try {
      await pool.query(`
        CREATE TRIGGER update_site_settings_updated_at 
          BEFORE UPDATE ON site_settings 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
      `);
      console.log('✅ Trigger created');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('✅ Trigger already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ site_settings table already exists');
    } else {
      console.error('\n❌ Migration failed:', error.message);
      console.error('Full error:', error);
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
