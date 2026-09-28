import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const categoryId = searchParams.get('category_id');

    const db = getDatabase();
    let query = `
      SELECT e.*, ec.name as category_name, u.name as created_by_name
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (from) {
      query += ` AND date(e.expense_date) >= date(?)`;
      params.push(from);
    }
    if (to) {
      query += ` AND date(e.expense_date) <= date(?)`;
      params.push(to);
    }
    if (categoryId && categoryId !== 'all') {
      query += ` AND e.category_id = ?`;
      params.push(categoryId);
    }

    query += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

    const expenses = db.prepare(query).all(...params) as any[];
    const categories = db.prepare('SELECT * FROM expense_categories ORDER BY name ASC').all();

    const total = expenses.reduce((sum, item) => sum + item.amount, 0);

    return NextResponse.json({ expenses, categories, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { expense_date, category_id, description, amount, payment_method, vendor_person, notes } = await request.json();

    if (!expense_date || !category_id || !description || amount === undefined) {
      return NextResponse.json({ error: 'Missing required expense fields' }, { status: 400 });
    }

    const db = getDatabase();
    const expenseId = `exp-${Date.now()}`;

    db.prepare(`
      INSERT INTO expenses (
        id, expense_date, category_id, description, amount,
        payment_method, vendor_person, created_by, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      expenseId,
      expense_date,
      category_id,
      description,
      Number(amount),
      payment_method || 'cash',
      vendor_person || null,
      user.id,
      notes || null
    );

    return NextResponse.json({ success: true, expenseId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
