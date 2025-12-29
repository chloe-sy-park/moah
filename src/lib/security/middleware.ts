import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders } from './utils';

export interface SecurityOptions {
  requireAuth?: boolean;
  rateLimit?: number;
}

export function withSecurity(handler: (req: NextRequest) => Promise<NextResponse>, _options: SecurityOptions = {}) {
  return async (request: NextRequest) => {
    try {
      const response = await handler(request);
      const headers = getSecurityHeaders();
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: getSecurityHeaders() });
    }
  };
}
