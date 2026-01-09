import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET site lock status
export async function GET() {
  try {
    const result = await query(
      `SELECT value FROM site_settings WHERE key = 'site_locked'`
    );

    const isLocked = result.rows[0]?.value === 'true';

    return NextResponse.json({ 
      success: true, 
      locked: isLocked 
    });
  } catch (error: any) {
    console.error('Error fetching site lock status:', error);
    return NextResponse.json({ 
      success: false, 
      message: error?.message ?? 'Unable to fetch site lock status',
      locked: false 
    }, { status: 500 });
  }
}

// POST toggle site lock
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { locked } = body;

    if (typeof locked !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid lock value' 
      }, { status: 400 });
    }

    await query(
      `INSERT INTO site_settings (key, value) 
       VALUES ('site_locked', $1) 
       ON CONFLICT (key) 
       DO UPDATE SET value = $1, updated_at = NOW()`,
      [locked.toString()]
    );

    return NextResponse.json({ 
      success: true, 
      locked 
    });
  } catch (error: any) {
    console.error('Error toggling site lock:', error);
    return NextResponse.json({ 
      success: false, 
      message: error?.message ?? 'Unable to toggle site lock' 
    }, { status: 500 });
  }
}
