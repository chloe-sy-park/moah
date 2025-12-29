import ogs from 'open-graph-scraper';
import type { Platform } from '@/types/database';
import { detectPlatform, extractCreatorFromUrl, normalizeUrl, isValidUrl, PLATFORM_INFO } from './platform-detector';

export interface ExtractedMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string;
  siteName: string | null;
  platform: Platform;
  platformDisplayName: string;
  platformIcon: string;
  creatorName: string | null;
  creatorUrl: string | null;
  normalizedUrl: string;
}

export async function extractMetadata(url: string): Promise<ExtractedMetadata | null> {
  if (!isValidUrl(url)) return null;

  const normalizedUrl = normalizeUrl(url);
  const platform = detectPlatform(normalizedUrl);
  const platformInfo = PLATFORM_INFO[platform];

  try {
    const { result, error } = await ogs({ url: normalizedUrl, timeout: 10000 });
    if (error) return createFallback(normalizedUrl, platform, platformInfo);

    const creatorName = extractCreatorFromUrl(normalizedUrl, platform);
    const imageUrl = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null;

    return {
      title: result.ogTitle || result.twitterTitle || null,
      description: result.ogDescription || result.twitterDescription || null,
      image: imageUrl,
      url: result.ogUrl || normalizedUrl,
      siteName: result.ogSiteName || platformInfo.displayName,
      platform,
      platformDisplayName: platformInfo.displayName,
      platformIcon: platformInfo.icon,
      creatorName,
      creatorUrl: creatorName ? buildCreatorUrl(creatorName, platform) : null,
      normalizedUrl,
    };
  } catch {
    return createFallback(normalizedUrl, platform, platformInfo);
  }
}

function buildCreatorUrl(name: string, platform: Platform): string | null {
  const username = name.replace('@', '');
  switch (platform) {
    case 'instagram': return `https://instagram.com/${username}`;
    case 'youtube': return `https://youtube.com/@${username}`;
    case 'tiktok': return `https://tiktok.com/@${username}`;
    case 'twitter': return `https://x.com/${username}`;
    default: return null;
  }
}

function createFallback(url: string, platform: Platform, info: { displayName: string; icon: string }): ExtractedMetadata {
  const creatorName = extractCreatorFromUrl(url, platform);
  return {
    title: null, description: null, image: null, url, siteName: info.displayName,
    platform, platformDisplayName: info.displayName, platformIcon: info.icon,
    creatorName, creatorUrl: creatorName ? buildCreatorUrl(creatorName, platform) : null, normalizedUrl: url,
  };
}
