import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginToken, createSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/?error=missing_token', request.url));
  }
  
  const user = await verifyLoginToken(token);
  
  if (!user) {
    return NextResponse.redirect(new URL('/?error=invalid_token', request.url));
  }
  
  await createSession(user);
  
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
