import { createServiceClient } from '@/lib/supabase/server';
import type { Content, Platform, Tag } from '@/types/database';
import type { CreateContentInput, UpdateContentInput, ContentFilters, PaginationOptions, PaginatedResponse, ContentWithDetails, ServiceResult } from './types';

let platformCache: Map<Platform, string> | null = null;

async function getPlatformId(platformName: Platform): Promise<string | null> {
  const supabase = createServiceClient();
  if (platformCache?.has(platformName)) return platformCache.get(platformName) || null;
  const { data, error } = await supabase.from('platforms').select('id').eq('name', platformName).single();
  if (error || !data) return null;
  if (!platformCache) platformCache = new Map();
  const platformId = (data as { id: string }).id;
  platformCache.set(platformName, platformId);
  return platformId;
}

export async function getOrCreateTelegramUser(telegramId: string, username?: string): Promise<ServiceResult<{ userId: string }>> {
  const supabase = createServiceClient();
  const { data: existingUser } = await supabase.from('users').select('id').eq('telegram_id', telegramId).single();
  if (existingUser) return { success: true, data: { userId: (existingUser as { id: string }).id } };
  const { data: newUser, error } = await supabase.from('users').insert({ telegram_id: telegramId, telegram_username: username || null }).select('id').single();
  if (error || !newUser) return { success: false, error: 'Failed to create user', code: 'USER_CREATE_ERROR' };
  return { success: true, data: { userId: (newUser as { id: string }).id } };
}

async function getOrCreateTags(tagNames: string[]): Promise<Tag[]> {
  if (tagNames.length === 0) return [];
  const supabase = createServiceClient();
  const uniqueNames = [...new Set(tagNames.map(n => n.toLowerCase().trim()))].filter(n => n.length > 0);
  const { data: existingTags } = await supabase.from('tags').select('*').in('name', uniqueNames);
  const existingNames = new Set(existingTags?.map(t => t.name) || []);
  const newNames = uniqueNames.filter(name => !existingNames.has(name));
  if (newNames.length > 0) {
    const { data: newTags } = await supabase.from('tags').insert(newNames.map(name => ({ name }))).select();
    return [...(existingTags || []), ...(newTags || [])];
  }
  return existingTags || [];
}

export async function createContent(input: CreateContentInput): Promise<ServiceResult<ContentWithDetails>> {
  const supabase = createServiceClient();
  const platformId = await getPlatformId(input.metadata.platform);
  if (!platformId) return { success: false, error: 'Invalid platform', code: 'INVALID_PLATFORM' };
  const { data: existing } = await supabase.from('contents').select('id').eq('user_id', input.userId).eq('url', input.metadata.normalizedUrl).single();
  if (existing) return { success: false, error: 'Content already saved', code: 'DUPLICATE_URL' };
  const { data: content, error } = await supabase.from('contents').insert({
    user_id: input.userId, platform_id: platformId, url: input.metadata.normalizedUrl, title: input.metadata.title,
    description: input.metadata.description, thumbnail_url: input.metadata.image, creator_name: input.metadata.creatorName,
    creator_url: input.metadata.creatorUrl, memo: input.memo || null, saved_at: new Date().toISOString(),
  }).select('*, platform:platforms(*)').single();
  if (error || !content) return { success: false, error: 'Failed to save content', code: 'SAVE_ERROR' };
  let tags: Tag[] = [];
  if (input.tags?.length) {
    tags = await getOrCreateTags(input.tags.map(t => t.name));
    if (tags.length > 0) await supabase.from('content_tags').insert(tags.map(tag => ({ content_id: content.id, tag_id: tag.id })));
  }
  return { success: true, data: { ...content, tags, platformInfo: { name: content.platform.name, displayName: content.platform.display_name, icon: content.platform.icon, colorBg: content.platform.color_bg, colorText: content.platform.color_text } } as ContentWithDetails };
}

export async function getContentById(contentId: string, userId: string): Promise<ServiceResult<ContentWithDetails>> {
  const supabase = createServiceClient();
  const { data: content, error } = await supabase.from('contents').select('*, platform:platforms(*), content_tags(tag:tags(*))').eq('id', contentId).eq('user_id', userId).single();
  if (error || !content) return { success: false, error: 'Content not found', code: 'NOT_FOUND' };
  const tags = content.content_tags?.map((ct: { tag: Tag }) => ct.tag) || [];
  return { success: true, data: { ...content, tags, platformInfo: { name: content.platform.name, displayName: content.platform.display_name, icon: content.platform.icon, colorBg: content.platform.color_bg, colorText: content.platform.color_text } } as ContentWithDetails };
}

export async function getContents(userId: string, filters: ContentFilters = {}, pagination: PaginationOptions = {}): Promise<ServiceResult<PaginatedResponse<ContentWithDetails>>> {
  const supabase = createServiceClient();
  const { page = 1, limit = 20, sortBy = 'saved_at', sortOrder = 'desc' } = pagination;
  const offset = (page - 1) * limit;
  let query = supabase.from('contents').select('*, platform:platforms(*), content_tags(tag:tags(*))', { count: 'exact' }).eq('user_id', userId);
  if (filters.platform) { const pid = await getPlatformId(filters.platform); if (pid) query = query.eq('platform_id', pid); }
  if (filters.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(offset, offset + limit - 1);
  const { data: contents, error, count } = await query;
  if (error) return { success: false, error: 'Failed to fetch contents', code: 'FETCH_ERROR' };
  const total = count || 0;
  const transformedContents: ContentWithDetails[] = (contents || []).map(content => {
    const tags = content.content_tags?.map((ct: { tag: Tag }) => ct.tag) || [];
    return { ...content, tags, platformInfo: { name: content.platform.name, displayName: content.platform.display_name, icon: content.platform.icon, colorBg: content.platform.color_bg, colorText: content.platform.color_text } };
  });
  let filteredContents = transformedContents;
  if (filters.tags?.length) filteredContents = transformedContents.filter(c => c.tags.some(t => filters.tags!.includes(t.name.toLowerCase())));
  return { success: true, data: { data: filteredContents, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 } } };
}

export async function updateContent(contentId: string, userId: string, input: UpdateContentInput): Promise<ServiceResult<ContentWithDetails>> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase.from('contents').select('id').eq('id', contentId).eq('user_id', userId).single();
  if (!existing) return { success: false, error: 'Content not found', code: 'NOT_FOUND' };
  const updateData: Partial<Content> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.memo !== undefined) updateData.memo = input.memo;
  if (Object.keys(updateData).length > 0) await supabase.from('contents').update(updateData).eq('id', contentId);
  if (input.tags !== undefined) {
    await supabase.from('content_tags').delete().eq('content_id', contentId);
    if (input.tags.length > 0) {
      const tags = await getOrCreateTags(input.tags);
      await supabase.from('content_tags').insert(tags.map(tag => ({ content_id: contentId, tag_id: tag.id })));
    }
  }
  return getContentById(contentId, userId);
}

export async function deleteContent(contentId: string, userId: string): Promise<ServiceResult<void>> {
  const supabase = createServiceClient();
  const { error } = await supabase.from('contents').delete().eq('id', contentId).eq('user_id', userId);
  if (error) return { success: false, error: 'Failed to delete content', code: 'DELETE_ERROR' };
  return { success: true };
}

export async function getUserTags(userId: string): Promise<ServiceResult<{ tag: Tag; count: number }[]>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('content_tags').select('tag:tags(*), content:contents!inner(user_id)').eq('content.user_id', userId);
  if (error) return { success: false, error: 'Failed to fetch tags', code: 'FETCH_ERROR' };
  const tagCounts = new Map<string, { tag: Tag; count: number }>();
  (data as unknown as Array<{ tag: Tag | null }>)?.forEach(item => {
    if (item.tag) { const e = tagCounts.get(item.tag.id); if (e) e.count++; else tagCounts.set(item.tag.id, { tag: item.tag, count: 1 }); }
  });
  return { success: true, data: Array.from(tagCounts.values()).sort((a, b) => b.count - a.count) };
}

export async function getContentStats(userId: string): Promise<ServiceResult<{ total: number; byPlatform: Record<string, number>; byMonth: { month: string; count: number }[] }>> {
  const supabase = createServiceClient();
  const { count: total } = await supabase.from('contents').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const { data: platformCounts } = await supabase.from('contents').select('platform:platforms(name)').eq('user_id', userId);
  const byPlatform: Record<string, number> = {};
  (platformCounts as unknown as Array<{ platform: { name: string } | null }>)?.forEach(item => { if (item.platform?.name) byPlatform[item.platform.name] = (byPlatform[item.platform.name] || 0) + 1; });
  return { success: true, data: { total: total || 0, byPlatform, byMonth: [] } };
}
