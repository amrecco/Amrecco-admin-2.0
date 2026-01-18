
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken } from '@/src/lib/auth/jwt';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const payload = await verifyToken(refreshToken);

    const newAccessToken = await generateAccessToken({
      username: payload.username,
      role: payload.role,
    });

    const res = NextResponse.json({ message: 'Token refreshed' });

    res.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}