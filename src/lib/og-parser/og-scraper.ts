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

// Instagram oEmbed API response type
interface InstagramOEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  provider_name?: string;
}

/**
 * Extract metadata from Instagram using Facebook Graph API oEmbed
 */
async function extractInstagramMetadata(url: string): Promise<ExtractedMetadata | null> {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    console.warn('Facebook App credentials not configured, falling back to default scraper');
    return null;
  }

  const accessToken = `${appId}|${appSecret}`;
  const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;

  try {
    const response = await fetch(oembedUrl, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.error('Instagram oEmbed API error:', response.status);
      return null;
    }

    const data: InstagramOEmbedResponse = await response.json();
    const platformInfo = PLATFORM_INFO['instagram'];
    const creatorName = data.author_name || extractCreatorFromUrl(url, 'instagram');

    return {
      title: data.title || (creatorName ? `@${creatorName}의 Instagram 게시물` : 'Instagram 게시물'),
      description: data.title || null,
      image: data.thumbnail_url || null,
      url: url,
      siteName: data.provider_name || 'Instagram',
      platform: 'instagram',
      platformDisplayName: platformInfo.displayName,
      platformIcon: platformInfo.icon,
      creatorName: creatorName ? `@${creatorName}` : null,
      creatorUrl: creatorName ? `https://instagram.com/${creatorName}` : null,
      normalizedUrl: url,
    };
  } catch (error) {
    console.error('Instagram oEmbed fetch error:', error);
    return null;
  }
}

export async function extractMetadata(url: string): Promise<ExtractedMetadata | null> {
  if (!isValidUrl(url)) return null;

  const normalizedUrl = normalizeUrl(url);
  const platform = detectPlatform(normalizedUrl);
  const platformInfo = PLATFORM_INFO[platform];

  // Use Instagram oEmbed API for Instagram URLs
  if (platform === 'instagram') {
    const instagramData = await extractInstagramMetadata(normalizedUrl);
    if (instagramData) return instagramData;
    // Fall through to default scraper if oEmbed fails
  }

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
