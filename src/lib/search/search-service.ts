import { createServiceClient } from '@/lib/supabase/server';
import type { Platform } from '@/types/database';

export interface SearchOptions {
  query?: string;
  platform?: Platform;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'saved_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResultItem {
  id: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  url: string;
  platform: Platform;
  platformDisplayName: string;
  platformIcon: string;
  creatorName: string | null;
  tags: { id: string; name: string }[];
  savedAt: string;
  memo: string | null;
}

export interface SearchResponse {
  results: SearchResultItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  query: string;
  executionTimeMs: number;
}

const platformCache = new Map<string, { name: Platform; displayName: string; icon: string }>();

async function getPlatformInfo(platformId: string) {
  if (platformCache.has(platformId)) return platformCache.get(platformId)!;
  const supabase = createServiceClient();
  const { data } = await supabase.from('platforms').select('name, display_name, icon').eq('id', platformId).single();
  if (data) {
    const info = { name: data.name as Platform, displayName: data.display_name, icon: data.icon || '🌐' };
    platformCache.set(platformId, info);
    return info;
  }
  return null;
}

export async function searchContents(userId: string, options: SearchOptions = {}): Promise<SearchResponse> {
  const startTime = Date.now();
  const { query = '', page = 1, limit = 20, sortBy = 'saved_at', sortOrder = 'desc' } = options;
  const supabase = createServiceClient();
  const offset = (page - 1) * limit;

  let dbQuery = supabase.from('contents').select('*, platform_id, content_tags(tag:tags(*))', { count: 'exact' }).eq('user_id', userId);

  if (query.trim()) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,memo.ilike.%${query}%`);
  }
  if (options.startDate) dbQuery = dbQuery.gte('saved_at', options.startDate);
  if (options.endDate) dbQuery = dbQuery.lte('saved_at', options.endDate);

  const orderColumn = sortBy === 'relevance' ? 'saved_at' : sortBy;
  dbQuery = dbQuery.order(orderColumn, { ascending: sortOrder === 'asc' }).range(offset, offset + limit - 1);

  const { data: contents, error, count } = await dbQuery;
  if (error) return { results: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }, query, executionTimeMs: Date.now() - startTime };

  const results: SearchResultItem[] = await Promise.all(
    (contents || []).map(async (c) => {
      const platformInfo = await getPlatformInfo(c.platform_id);
      const tags = c.content_tags?.map((ct: { tag: { id: string; name: string } }) => ct.tag).filter(Boolean) || [];
      return {
        id: c.id, title: c.title, description: c.description, thumbnailUrl: c.thumbnail_url, url: c.url,
        platform: platformInfo?.name || 'web', platformDisplayName: platformInfo?.displayName || 'Web', platformIcon: platformInfo?.icon || '🌐',
        creatorName: c.creator_name, tags, savedAt: c.saved_at, memo: c.memo,
      };
    })
  );

  let filteredResults = results;
  if (options.tags?.length) {
    const filterTags = options.tags.map(t => t.toLowerCase());
    filteredResults = results.filter(r => r.tags.some(t => filterTags.includes(t.name.toLowerCase())));
  }
  if (options.platform) {
    filteredResults = filteredResults.filter(r => r.platform === options.platform);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    results: filteredResults,
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    query,
    executionTimeMs: Date.now() - startTime,
  };
}

export async function getSearchSuggestions(userId: string, query: string, limit = 5): Promise<string[]> {
  if (!query.trim() || query.length < 2) return [];
  const supabase = createServiceClient();
  const { data: tags } = await supabase.from('tags').select('name').ilike('name', `%${query}%`).limit(limit);
  return (tags || []).map(t => t.name);
}
