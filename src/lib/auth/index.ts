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
    console.error('[AUTH] Failed to create login token:', error);
    return null;
  }
  
  return token;
}

export async function verifyLoginToken(token: string): Promise<SessionUser | null> {
  const supabase = createServiceClient();
  
  console.log('[AUTH] Verifying token:', token.substring(0, 10) + '...');
  console.log('[AUTH] Current time:', new Date().toISOString());
  
  // Step 1: Get token data
  const { data: tokenData, error: tokenError } = await supabase
    .from('login_tokens')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  console.log('[AUTH] Token query result:', { tokenData: tokenData ? 'found' : 'not found', tokenError });
  
  if (tokenError || !tokenData) {
    console.error('[AUTH] Token verification failed:', tokenError);
    
    // Debug: Check if token exists at all
    const { data: anyToken } = await supabase
      .from('login_tokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (anyToken) {
      console.log('[AUTH] Token exists but:', {
        used_at: anyToken.used_at,
        expires_at: anyToken.expires_at,
        isExpired: new Date(anyToken.expires_at) < new Date(),
        isUsed: anyToken.used_at !== null
      });
    } else {
      console.log('[AUTH] Token does not exist in database');
    }
    
    return null;
  }
  
  // Step 2: Get user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', tokenData.user_id)
    .single();
  
  console.log('[AUTH] User query result:', { userData: userData ? 'found' : 'not found', userError });
  
  if (userError || !userData) {
    console.error('[AUTH] User fetch failed:', userError);
    return null;
  }
  
  // Mark token as used
  await supabase
    .from('login_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenData.id);
  
  console.log('[AUTH] Token marked as used, returning user');
  
  return userData as SessionUser;
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
  
  // Step 1: Get token data
  const { data: tokenData, error: tokenError } = await supabase
    .from('login_tokens')
    .select('*')
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (tokenError || !tokenData) return null;
  
  // Step 2: Get user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', tokenData.user_id)
    .single();
  
  if (userError || !userData) return null;
  
  return userData as SessionUser;
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
