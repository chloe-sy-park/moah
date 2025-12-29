import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const SESSION_COOKIE = 'moah_session';
const SESSION_EXPIRY_DAYS = 7;

export interface SessionUser {
  id: string;
  telegram_id: string | null;
  telegram_username: string | null;
  email: string | null;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createLoginToken(userId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  const { error } = await supabase.from('login_tokens').insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });
  
  if (error) {
    console.error('Failed to create login token:', error);
    return null;
  }
  
  return token;
}

export async function verifyLoginToken(token: string): Promise<SessionUser | null> {
  const supabase = createServiceClient();
  
  const { data: tokenData, error } = await supabase
    .from('login_tokens')
    .select('*, user:users(*)')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !tokenData) return null;
  
  // Mark token as used
  await supabase.from('login_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenData.id);
  
  const user = tokenData.user as SessionUser;
  return user;
}

export async function createSession(user: SessionUser): Promise<string> {
  const supabase = createServiceClient();
  const sessionToken = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  // Store session in login_tokens (reusing table for simplicity)
  await supabase.from('login_tokens').insert({
    user_id: user.id,
    token: sessionToken,
    expires_at: expiresAt.toISOString(),
  });
  
  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  return sessionToken;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  
  if (!sessionToken) return null;
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('login_tokens')
    .select('*, user:users(*)')
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !data) return null;
  
  return data.user as SessionUser;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  
  if (sessionToken) {
    const supabase = createServiceClient();
    await supabase.from('login_tokens').delete().eq('token', sessionToken);
  }
  
  cookieStore.delete(SESSION_COOKIE);
}
