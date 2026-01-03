import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all feedback modules with their elements
export async function GET() {
  try {
    const modulesRes = await query(
      `SELECT id, title, description, position, created_at, updated_at
       FROM feedback_modules
       ORDER BY position ASC, created_at ASC`
    );

    const elementsRes = await query(
      `SELECT id, module_id, content, position, created_at, updated_at
       FROM feedback_elements
       ORDER BY module_id ASC, position ASC, created_at ASC`
    );

    const elementsByModule = new Map<string, any[]>();
    for (const row of elementsRes.rows) {
      const list = elementsByModule.get(row.module_id) ?? [];
      list.push({
        id: row.id,
        moduleId: row.module_id,
        content: row.content,
        position: row.position,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
      elementsByModule.set(row.module_id, list);
    }

    const modules = modulesRes.rows.map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      position: module.position,
      createdAt: module.created_at,
      updatedAt: module.updated_at,
      elements: elementsByModule.get(module.id) ?? [],
    }));

    return NextResponse.json({ success: true, modules });
  } catch (error: any) {
    console.error('Error fetching feedback modules', error);
    const message = error?.message ?? 'Unable to fetch feedback modules';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

// POST create a new feedback module
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, message: 'Module title is required' }, { status: 400 });
    }

    const { rows } = await query(
      `INSERT INTO feedback_modules (title, description, position)
       VALUES ($1, $2, COALESCE((SELECT MAX(position) FROM feedback_modules), 0) + 1)
       RETURNING id, title, description, position, created_at, updated_at`,
      [title.trim(), description?.trim() ?? null]
    );

    if (!rows[0]) {
      throw new Error('Failed to create feedback module');
    }

    const module = rows[0];
    return NextResponse.json({
      success: true,
      module: {
        id: module.id,
        title: module.title,
        description: module.description,
        position: module.position,
        createdAt: module.created_at,
        updatedAt: module.updated_at,
        elements: [],
      },
    });
  } catch (error: any) {
    console.error('Error creating feedback module', error);
    const message = error?.message ?? 'Unable to create feedback module';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
