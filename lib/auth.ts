import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_session';

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !session) return false;
  return session.value === secret;
}

export async function setAdminCookie(secret: string): Promise<boolean> {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || secret !== expected) return false;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return true;
}

export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
