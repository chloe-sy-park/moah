import { createServiceClient } from '@/lib/supabase/server';
import type { Folder, FolderWithStats, FolderWithContents, ContentWithRelations, CreateFolderRequest, UpdateFolderRequest } from '@/types/database';

export async function getUserFolders(userId: string): Promise<{ success: boolean; folders?: FolderWithStats[]; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data: folders, error } = await supabase.from('folders').select('*, folder_contents(count)').eq('user_id', userId).order('sort_order', { ascending: true });
    if (error) return { success: false, error: error.message };
    const foldersWithStats: FolderWithStats[] = (folders || []).map(f => ({ ...f, content_count: f.folder_contents?.[0]?.count || 0, latest_added_at: null }));
    return { success: true, folders: foldersWithStats };
  } catch (error) { return { success: false, error: 'Failed to get folders' }; }
}

export async function getFolder(folderId: string): Promise<{ success: boolean; folder?: FolderWithStats; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data: folder, error } = await supabase.from('folders').select('*').eq('id', folderId).single();
    if (error) return { success: false, error: error.message };
    const { count } = await supabase.from('folder_contents').select('*', { count: 'exact', head: true }).eq('folder_id', folderId);
    return { success: true, folder: { ...folder, content_count: count || 0, latest_added_at: null } };
  } catch (error) { return { success: false, error: 'Failed to get folder' }; }
}

export async function getFolderWithContents(folderId: string, options: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}): Promise<{ success: boolean; folder?: FolderWithContents; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { page = 1, limit = 20, sortBy = 'added_at', sortOrder = 'desc' } = options;
    const { data: folder, error } = await supabase.from('folders').select('*').eq('id', folderId).single();
    if (error) return { success: false, error: error.message };
    const offset = (page - 1) * limit;
    const { data: folderContents } = await supabase.from('folder_contents').select('content_id, added_at, sort_order').eq('folder_id', folderId).order(sortBy === 'added_at' ? 'added_at' : 'sort_order', { ascending: sortOrder === 'asc' }).range(offset, offset + limit - 1);
    const contentIds = (folderContents || []).map(fc => fc.content_id);
    let contents: ContentWithRelations[] = [];
    if (contentIds.length > 0) {
      const { data: contentsData } = await supabase.from('contents').select('*, platform:platforms(*), content_tags(tag:tags(*))').in('id', contentIds);
      contents = (contentsData || []).map(c => ({ ...c, tags: c.content_tags?.map((ct: { tag: unknown }) => ct.tag) || [] }));
    }
    return { success: true, folder: { ...folder, content_count: contentIds.length, latest_added_at: folderContents?.[0]?.added_at || null, contents } };
  } catch (error) { return { success: false, error: 'Failed to get folder contents' }; }
}

export async function createFolder(userId: string, data: CreateFolderRequest): Promise<{ success: boolean; folder?: Folder; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { count } = await supabase.from('folders').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { data: folder, error } = await supabase.from('folders').insert({ user_id: userId, name: data.name, description: data.description || null, color: data.color || '#6B7280', icon: data.icon || '📁', is_default: false, sort_order: (count || 0) + 1 }).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, folder };
  } catch (error) { return { success: false, error: 'Failed to create folder' }; }
}

export async function updateFolder(folderId: string, userId: string, data: UpdateFolderRequest): Promise<{ success: boolean; folder?: Folder; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data: existing } = await supabase.from('folders').select('is_default').eq('id', folderId).eq('user_id', userId).single();
    if (!existing) return { success: false, error: 'Folder not found' };
    const updateData: Partial<Folder> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
    const { data: folder, error } = await supabase.from('folders').update(updateData).eq('id', folderId).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, folder };
  } catch (error) { return { success: false, error: 'Failed to update folder' }; }
}

export async function deleteFolder(folderId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data: existing } = await supabase.from('folders').select('is_default').eq('id', folderId).eq('user_id', userId).single();
    if (!existing) return { success: false, error: 'Folder not found' };
    if (existing.is_default) return { success: false, error: 'Cannot delete default folder' };
    const { error } = await supabase.from('folders').delete().eq('id', folderId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) { return { success: false, error: 'Failed to delete folder' }; }
}

export async function addContentsToFolder(folderId: string, contentIds: string[]): Promise<{ success: boolean; added?: number; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data: existing } = await supabase.from('folder_contents').select('content_id').eq('folder_id', folderId).in('content_id', contentIds);
    const existingIds = new Set((existing || []).map(e => e.content_id));
    const newIds = contentIds.filter(id => !existingIds.has(id));
    if (newIds.length === 0) return { success: true, added: 0 };
    const { count } = await supabase.from('folder_contents').select('*', { count: 'exact', head: true }).eq('folder_id', folderId);
    const inserts = newIds.map((contentId, idx) => ({ folder_id: folderId, content_id: contentId, sort_order: (count || 0) + idx + 1 }));
    const { error } = await supabase.from('folder_contents').insert(inserts);
    if (error) return { success: false, error: error.message };
    return { success: true, added: newIds.length };
  } catch (error) { return { success: false, error: 'Failed to add contents' }; }
}

export async function removeContentsFromFolder(folderId: string, contentIds: string[]): Promise<{ success: boolean; removed?: number; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { error, count } = await supabase.from('folder_contents').delete().eq('folder_id', folderId).in('content_id', contentIds);
    if (error) return { success: false, error: error.message };
    return { success: true, removed: count || 0 };
  } catch (error) { return { success: false, error: 'Failed to remove contents' }; }
}

export async function moveContent(contentId: string, fromFolderId: string, toFolderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    await supabase.from('folder_contents').delete().eq('folder_id', fromFolderId).eq('content_id', contentId);
    const { count } = await supabase.from('folder_contents').select('*', { count: 'exact', head: true }).eq('folder_id', toFolderId);
    const { error } = await supabase.from('folder_contents').insert({ folder_id: toFolderId, content_id: contentId, sort_order: (count || 0) + 1 });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) { return { success: false, error: 'Failed to move content' }; }
}

export async function getContentFolders(contentId: string): Promise<{ success: boolean; folders?: Folder[]; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from('folder_contents').select('folder_id').eq('content_id', contentId);
    if (error) return { success: false, error: error.message };
    const folderIds = (data || []).map(d => d.folder_id);
    if (folderIds.length === 0) return { success: true, folders: [] };
    const { data: folders, error: foldersError } = await supabase.from('folders').select('*').in('id', folderIds);
    if (foldersError) return { success: false, error: foldersError.message };
    return { success: true, folders: folders || [] };
  } catch (error) { return { success: false, error: 'Failed to get content folders' }; }
}

export async function getOrCreateDefaultFolder(userId: string): Promise<{ success: boolean; folder?: Folder; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data: existing } = await supabase.from('folders').select('*').eq('user_id', userId).eq('is_default', true).single();
    if (existing) return { success: true, folder: existing };
    const { data: folder, error } = await supabase.from('folders').insert({ user_id: userId, name: '모아둘 곳', description: '기본 폴더', color: '#6B7280', icon: '📥', is_default: true, sort_order: 0 }).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, folder };
  } catch (error) { return { success: false, error: 'Failed to get default folder' }; }
}

export async function reorderFolders(userId: string, folderIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    for (let i = 0; i < folderIds.length; i++) {
      await supabase.from('folders').update({ sort_order: i + 1 }).eq('id', folderIds[i]).eq('user_id', userId);
    }
    return { success: true };
  } catch (error) { return { success: false, error: 'Failed to reorder folders' }; }
}
