import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET questions for a module
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params;

    const questionsRes = await query(
      `SELECT id, module_id, title, description, position, created_at, updated_at
       FROM feedback_questions
       WHERE module_id = $1
       ORDER BY position ASC, created_at ASC`,
      [moduleId]
    );

    const elementsRes = await query(
      `SELECT e.id, e.question_id, e.content, e.position, e.created_at, e.updated_at
       FROM feedback_elements e
       INNER JOIN feedback_questions q ON e.question_id = q.id
       WHERE q.module_id = $1
       ORDER BY e.question_id ASC, e.position ASC, e.created_at ASC`,
      [moduleId]
    );

    const elementsByQuestion = new Map<string, any[]>();
    for (const row of elementsRes.rows) {
      const list = elementsByQuestion.get(row.question_id) ?? [];
      list.push({
        id: row.id,
        questionId: row.question_id,
        content: row.content,
        position: row.position,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
      elementsByQuestion.set(row.question_id, list);
    }

    const questions = questionsRes.rows.map((question: any) => ({
      id: question.id,
      moduleId: question.module_id,
      title: question.title,
      description: question.description,
      position: question.position,
      createdAt: question.created_at,
      updatedAt: question.updated_at,
      elements: elementsByQuestion.get(question.id) ?? [],
    }));

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    console.error('Error fetching questions', error);
    const message = error?.message ?? 'Unable to fetch questions';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

// POST create a new question in a module
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params;
    const body = await request.json();
    const { title, description } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Question title is required' },
        { status: 400 }
      );
    }

    const { rows } = await query(
      `INSERT INTO feedback_questions (module_id, title, description, position)
       VALUES ($1, $2, $3, COALESCE((SELECT MAX(position) FROM feedback_questions WHERE module_id = $1), 0) + 1)
       RETURNING id, module_id, title, description, position, created_at, updated_at`,
      [moduleId, title.trim(), description?.trim() ?? null]
    );

    if (!rows[0]) {
      throw new Error('Failed to create question');
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
        elements: [],
      },
    });
  } catch (error: any) {
    console.error('Error creating question', error);
    const message = error?.message ?? 'Unable to create question';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
