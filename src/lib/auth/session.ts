import { verifyToken } from './jwt';

export async function getSession(token: string | null) {
  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    return {
      user: {
        username: payload.username,
        role: payload.role
      }
    };
  } catch {
    return null;
  }
}

export function destroySession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}