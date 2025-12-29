import { createHmac } from 'crypto';

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch { return false; }
}

export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function isValidTelegramId(id: string): boolean {
  return /^\d{1,20}$/.test(id);
}

export function sanitizeString(input: string, maxLength = 1000): string {
  return input.replace(/<[^>]*>/g, '').trim().slice(0, maxLength);
}

export function verifyTelegramWebhook(request: Request, secret: string): boolean {
  const token = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  return token === secret;
}

export function isValidTelegramUpdate(update: unknown): update is { update_id: number; message?: unknown } {
  if (!update || typeof update !== 'object') return false;
  const u = update as Record<string, unknown>;
  return typeof u.update_id === 'number';
}

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };
}

export function hashApiKey(key: string): string {
  return createHmac('sha256', process.env.API_KEY_SECRET || 'default').update(key).digest('hex');
}
