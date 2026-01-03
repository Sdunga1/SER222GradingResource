import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// PUT update a feedback module
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, position } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, message: 'Module title is required' }, { status: 400 });
    }

    let updateQuery = `UPDATE feedback_modules SET title = $1, description = $2, updated_at = NOW()`;
    let params_arr: any[] = [title.trim(), description?.trim() ?? null];
    let paramIndex = 3;

    if (position !== undefined) {
      updateQuery += `, position = $${paramIndex}`;
      params_arr.push(position);
      paramIndex++;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, title, description, position, created_at, updated_at`;
    params_arr.push(id);

    const { rows } = await query(updateQuery, params_arr);

    if (!rows[0]) {
      return NextResponse.json({ success: false, message: 'Module not found' }, { status: 404 });
    }

    const module = rows[0];

    // Fetch elements for this module
    const elementsRes = await query(
      `SELECT id, module_id, content, position, created_at, updated_at
       FROM feedback_elements
       WHERE module_id = $1
       ORDER BY position ASC, created_at ASC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      module: {
        id: module.id,
        title: module.title,
        description: module.description,
        position: module.position,
        createdAt: module.created_at,
        updatedAt: module.updated_at,
        elements: elementsRes.rows.map((el: any) => ({
          id: el.id,
          moduleId: el.module_id,
          content: el.content,
          position: el.position,
          createdAt: el.created_at,
          updatedAt: el.updated_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error updating feedback module', error);
    const message = error?.message ?? 'Unable to update feedback module';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

// DELETE a feedback module
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { rowCount } = await query(`DELETE FROM feedback_modules WHERE id = $1`, [id]);

    if (rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Module deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting feedback module', error);
    const message = error?.message ?? 'Unable to delete feedback module';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
