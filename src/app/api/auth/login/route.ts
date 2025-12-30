import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginToken, createSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  console.log('[LOGIN] Token received:', token ? `${token.substring(0, 10)}...` : 'null');
  
  if (!token) {
    console.log('[LOGIN] Error: Missing token');
    return NextResponse.redirect(new URL('/?error=missing_token', request.url));
  }
  
  try {
    const user = await verifyLoginToken(token);
    
    console.log('[LOGIN] User verification result:', user ? `Found: ${user.telegram_username}` : 'Not found');
    
    if (!user) {
      console.log('[LOGIN] Error: Invalid token');
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url));
    }
    
    await createSession(user);
    console.log('[LOGIN] Session created, redirecting to dashboard');
    
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('[LOGIN] Exception:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
