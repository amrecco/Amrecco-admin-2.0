// app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = NextResponse.json(
      { message: 'Logged out successfully', success: true },
      { status: 200 }
    );

    // Delete authentication cookies
    res.cookies.delete('accessToken');
    res.cookies.delete('refreshToken');

    return res;
  } catch (error) {
    return NextResponse.json(
      { message: 'Logout failed', success: false },
      { status: 500 }
    );
  }
}