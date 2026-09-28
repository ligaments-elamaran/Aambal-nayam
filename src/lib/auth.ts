import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDatabase } from './db';
import { User } from '@/types';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'tea-shop-secret-super-key-tamil-heritage-2025');
const COOKIE_NAME = 'tea_shop_session';

export async function createSessionToken(user: { id: string; username: string; role: string; name: string }) {
  return await new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as { id: string; username: string; role: 'admin' | 'cashier'; name: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const db = getDatabase();
  const user = db.prepare('SELECT id, username, name, role, is_active, created_at FROM users WHERE id = ?').get(payload.id) as User | undefined;
  return user || null;
}

export { COOKIE_NAME };
