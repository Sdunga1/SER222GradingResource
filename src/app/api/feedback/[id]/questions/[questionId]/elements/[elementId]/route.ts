import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// PUT update a feedback element
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string; elementId: string }> }
) {
  try {
    const { elementId } = await params;
    const body = await request.json();
    const { content, position } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Element content is required' },
        { status: 400 }
      );
    }

    let updateQuery = `UPDATE feedback_elements SET content = $1, updated_at = NOW()`;
    let params_arr: any[] = [content.trim()];
    let paramIndex = 2;

    if (position !== undefined) {
      updateQuery += `, position = $${paramIndex}`;
      params_arr.push(position);
      paramIndex++;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, question_id, content, position, created_at, updated_at`;
    params_arr.push(elementId);

    const { rows } = await query(updateQuery, params_arr);

    if (!rows[0]) {
      return NextResponse.json(
        { success: false, message: 'Element not found' },
        { status: 404 }
      );
    }

    const element = rows[0];
    return NextResponse.json({
      success: true,
      element: {
        id: element.id,
        questionId: element.question_id,
        content: element.content,
        position: element.position,
        createdAt: element.created_at,
        updatedAt: element.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error updating feedback element', error);
    const message = error?.message ?? 'Unable to update feedback element';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

// DELETE a feedback element
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; questionId: string; elementId: string }> }
) {
  try {
    const { elementId } = await params;

    const { rowCount } = await query(
      `DELETE FROM feedback_elements WHERE id = $1`,
      [elementId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Element not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Element deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting feedback element', error);
    const message = error?.message ?? 'Unable to delete feedback element';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
