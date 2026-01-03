import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET a specific question
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { questionId } = await params;

    const questionRes = await query(
      `SELECT id, module_id, title, description, position, created_at, updated_at
       FROM feedback_questions
       WHERE id = $1`,
      [questionId]
    );

    if (questionRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Question not found' },
        { status: 404 }
      );
    }

    const elementsRes = await query(
      `SELECT id, question_id, content, position, created_at, updated_at
       FROM feedback_elements
       WHERE question_id = $1
       ORDER BY position ASC, created_at ASC`,
      [questionId]
    );

    const question = questionRes.rows[0];
    const elements = elementsRes.rows.map((element: any) => ({
      id: element.id,
      questionId: element.question_id,
      content: element.content,
      position: element.position,
      createdAt: element.created_at,
      updatedAt: element.updated_at,
    }));

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        moduleId: question.module_id,
        title: question.title,
        description: question.description,
        position: question.position,
        createdAt: question.created_at,
        updatedAt: question.updated_at,
        elements,
      },
    });
  } catch (error: any) {
    console.error('Error fetching question', error);
    const message = error?.message ?? 'Unable to fetch question';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

// PUT update a question
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const body = await request.json();
    const { title, description } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Question title is required' },
        { status: 400 }
      );
    }

    const { rows } = await query(
      `UPDATE feedback_questions
       SET title = $1, description = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, module_id, title, description, position, created_at, updated_at`,
      [title.trim(), description?.trim() ?? null, questionId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Question not found' },
        { status: 404 }
      );
    }

    const question = rows[0];
    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        moduleId: question.module_id,
        title: question.title,
        description: question.description,
        position: question.position,
        createdAt: question.created_at,
        updatedAt: question.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error updating question', error);
    const message = error?.message ?? 'Unable to update question';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

// DELETE a question
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { questionId } = await params;

    const { rowCount } = await query(
      `DELETE FROM feedback_questions WHERE id = $1`,
      [questionId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting question', error);
    const message = error?.message ?? 'Unable to delete question';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
