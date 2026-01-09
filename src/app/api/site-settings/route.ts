import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET site lock status
export async function GET() {
  try {
    const lockResult = await query(
      `SELECT value FROM site_settings WHERE key = 'site_locked'`
    );
    
    const timestampResult = await query(
      `SELECT value FROM site_settings WHERE key = 'lock_timestamp'`
    );

    const isLocked = lockResult.rows[0]?.value === 'true';
    const lockTimestamp = timestampResult.rows[0]?.value || Date.now().toString();

    return NextResponse.json({ 
      success: true, 
      locked: isLocked,
      lockTimestamp 
    });
  } catch (error: any) {
    console.error('Error fetching site lock status:', error);
    return NextResponse.json({ 
      success: false, 
      message: error?.message ?? 'Unable to fetch site lock status',
      locked: false,
      lockTimestamp: Date.now().toString()
    }, { status: 500 });
  }
}

// POST toggle site lock
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { locked } = body;

    const lockTimestamp = Date.now().toString();

    await query(
      `INSERT INTO site_settings (key, value) 
       VALUES ('site_locked', $1) 
       ON CONFLICT (key) 
       DO UPDATE SET value = $1, updated_at = NOW()`,
      [locked.toString()]
    );
    
    // Update lock timestamp when locking the site
    if (locked) {
      await query(
        `INSERT INTO site_settings (key, value) 
         VALUES ('lock_timestamp', $1) 
         ON CONFLICT (key) 
         DO UPDATE SET value = $1, updated_at = NOW()`,
        [lockTimestamp]
      );
    }

    return NextResponse.json({ 
      success: true, 
      locked,
      lockTimestamp 
    });
  } catch (error: any) {
    console.error('Error toggling site lock:', error);
    return NextResponse.json({ 
      success: false, 
      message: error?.message ?? 'Unable to toggle site lock' 
    }, { status: 500 });
  }
}
