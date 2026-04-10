import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password)
      return Response.json({ error: 'All fields required' }, { status: 400 });

    const existing = await query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (existing.length > 0)
      return Response.json({ error: 'Email already registered' }, { status: 400 });

    const password_hash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const rows = await query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [userId, name, email, password_hash, role || 'parent']
    );
    const user = rows[0];

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return Response.json({ user });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}