import { NextRequest, NextResponse } from 'next/server';

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function withLogging<T>(handler: (request: NextRequest, context?: T) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    try {
      const response = await handler(request, context);
      console.log(`[${requestId}] ${request.method} ${request.nextUrl.pathname} ${response.status} ${Date.now() - startTime}ms`);
      response.headers.set('x-request-id', requestId);
      return response;
    } catch (error) {
      console.error(`[${requestId}] ${request.method} ${request.nextUrl.pathname} ERROR`, error);
      return NextResponse.json({ success: false, error: 'Internal server error', requestId }, { status: 500, headers: { 'x-request-id': requestId } });
    }
  };
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, limit = 100, windowMs = 60000): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || record.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }
  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  record.count++;
  return { allowed: true, remaining: limit - record.count, resetIn: record.resetTime - now };
}

export function withRateLimit<T>(handler: (request: NextRequest, context?: T) => Promise<NextResponse>, limit = 100, windowMs = 60000) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const key = `${ip}:${request.nextUrl.pathname}`;
    const { allowed, remaining, resetIn } = checkRateLimit(key, limit, windowMs);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429, headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)) } });
    }
    const response = await handler(request, context);
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  };
}

export function withMiddleware<T>(handler: (request: NextRequest, context?: T) => Promise<NextResponse>, options: { rateLimit?: number; rateLimitWindow?: number } = {}) {
  let wrapped = handler;
  if (options.rateLimit) wrapped = withRateLimit(wrapped, options.rateLimit, options.rateLimitWindow);
  wrapped = withLogging(wrapped);
  return wrapped;
}
