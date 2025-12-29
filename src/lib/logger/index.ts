const _isProduction = process.env.NODE_ENV === 'production';

export const log = {
  info: (msg: string, data?: object) => console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg: string, data?: object) => console.warn(`[WARN] ${msg}`, data || ''),
  error: (msg: string, error?: Error) => console.error(`[ERROR] ${msg}`, error?.message || ''),
  debug: (msg: string, data?: object) => console.log(`[DEBUG] ${msg}`, data || ''),
  metric: (name: string, value: number, unit: string, tags?: object) =>
    console.log(`[METRIC] ${name}=${value}${unit}`, tags || ''),
};
