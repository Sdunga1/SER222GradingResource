import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST create a new feedback element within a module
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ success: false, message: 'Element content is required' }, { status: 400 });
    }

    // Verify module exists
    const moduleCheck = await query(`SELECT id FROM feedback_modules WHERE id = $1`, [moduleId]);
    if (moduleCheck.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Module not found' }, { status: 404 });
    }

    const { rows } = await query(
      `INSERT INTO feedback_elements (module_id, content, position)
       VALUES ($1, $2, COALESCE((SELECT MAX(position) FROM feedback_elements WHERE module_id = $1), 0) + 1)
       RETURNING id, module_id, content, position, created_at, updated_at`,
      [moduleId, content.trim()]
    );

    if (!rows[0]) {
      throw new Error('Failed to create feedback element');
    }

    const element = rows[0];
    return NextResponse.json({
      success: true,
      element: {
        id: element.id,
        module_id: element.module_id,
        content: element.content,
        position: element.position,
        created_at: element.created_at,
        updated_at: element.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error creating feedback element', error);
    const message = error?.message ?? 'Unable to create feedback element';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
