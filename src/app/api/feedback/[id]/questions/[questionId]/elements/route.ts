import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST create a new feedback element within a question
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Element content is required' },
        { status: 400 }
      );
    }

    // Verify question exists
    const questionCheck = await query(
      `SELECT id FROM feedback_questions WHERE id = $1`,
      [questionId]
    );
    if (questionCheck.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Question not found' },
        { status: 404 }
      );
    }

    const { rows } = await query(
      `INSERT INTO feedback_elements (question_id, content, position)
       VALUES ($1, $2, COALESCE((SELECT MAX(position) FROM feedback_elements WHERE question_id = $1), 0) + 1)
       RETURNING id, question_id, content, position, created_at, updated_at`,
      [questionId, content.trim()]
    );

    if (!rows[0]) {
      throw new Error('Failed to create feedback element');
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
    console.error('Error creating feedback element', error);
    const message = error?.message ?? 'Unable to create feedback element';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
