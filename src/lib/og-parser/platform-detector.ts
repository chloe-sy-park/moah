import type { Platform } from '@/types/database';

const PLATFORM_PATTERNS: Record<Platform, RegExp[]> = {
  instagram: [
    /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories)\/[\w-]+/i,
    /^https?:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/i,
  ],
  youtube: [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/i,
    /^https?:\/\/youtu\.be\/[\w-]+/i,
  ],
  tiktok: [
    /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\/\d+/i,
    /^https?:\/\/vm\.tiktok\.com\/[\w]+/i,
  ],
  twitter: [
    /^https?:\/\/(www\.)?(twitter|x)\.com\/[\w]+\/status\/\d+/i,
  ],
  web: [],
};

export const PLATFORM_INFO: Record<Platform, { displayName: string; icon: string }> = {
  instagram: { displayName: 'Instagram', icon: '📸' },
  youtube: { displayName: 'YouTube', icon: '▶️' },
  tiktok: { displayName: 'TikTok', icon: '🎵' },
  twitter: { displayName: 'Twitter/X', icon: '🐦' },
  web: { displayName: 'Web', icon: '🌐' },
};

export function detectPlatform(url: string): Platform {
  const normalizedUrl = url.trim().toLowerCase();
  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    if (platform === 'web') continue;
    for (const pattern of patterns) {
      if (pattern.test(normalizedUrl)) return platform as Platform;
    }
  }
  return 'web';
}

export function extractCreatorFromUrl(url: string, platform: Platform): string | null {
  try {
    const urlObj = new URL(url);
    switch (platform) {
      case 'instagram': {
        const match = urlObj.pathname.match(/^\/([^\/]+)\/?$/);
        if (match && !['p', 'reel', 'tv', 'stories'].includes(match[1])) return `@${match[1]}`;
        return null;
      }
      case 'youtube': {
        const match = urlObj.pathname.match(/^\/@([^\/]+)/);
        if (match) return `@${match[1]}`;
        return null;
      }
      case 'tiktok': {
        const match = urlObj.pathname.match(/^\/@([^\/]+)/);
        if (match) return `@${match[1]}`;
        return null;
      }
      case 'twitter': {
        const match = urlObj.pathname.match(/^\/([^\/]+)/);
        if (match && !['home', 'explore', 'search'].includes(match[1])) return `@${match[1]}`;
        return null;
      }
      default: return null;
    }
  } catch { return null; }
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch { return false; }
}

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'igshid'].forEach(p => urlObj.searchParams.delete(p));
    return urlObj.toString();
  } catch { return url; }
}
