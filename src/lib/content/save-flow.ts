import { extractMetadata, isValidUrl } from '@/lib/og-parser';
import { generateTags, type GeneratedTag } from '@/lib/tagging';
import { createContent, getOrCreateTelegramUser } from './content-service';
import type { SaveContentFlowInput, SaveContentFlowResult, ContentWithDetails } from './types';
import type { ExtractedMetadata } from '@/lib/og-parser';

export async function saveContentFlow(input: SaveContentFlowInput): Promise<SaveContentFlowResult> {
  const { url, telegramUserId, userId, memo } = input;

  if (!url || !isValidUrl(url)) return { success: false, error: 'Invalid URL', step: 'validation' };

  let resolvedUserId = userId;
  if (!resolvedUserId && telegramUserId) {
    const userResult = await getOrCreateTelegramUser(telegramUserId);
    if (!userResult.success || !userResult.data) return { success: false, error: userResult.error || 'Failed to get user', step: 'validation' };
    resolvedUserId = userResult.data.userId;
  }
  if (!resolvedUserId) return { success: false, error: 'User ID is required', step: 'validation' };

  let metadata: ExtractedMetadata | null = null;
  try {
    metadata = await extractMetadata(url);
    if (!metadata) return { success: false, error: 'Failed to extract metadata', step: 'metadata' };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return { success: false, error: 'Failed to extract metadata', step: 'metadata' };
  }

  let tags: GeneratedTag[] = [];
  try {
    const result = await generateTags({ title: metadata.title, description: metadata.description, platform: metadata.platformDisplayName, contentType: 'content', creatorName: metadata.creatorName, url: metadata.normalizedUrl });
    tags = result.tags;
  } catch (error) {
    console.error('Tag generation error:', error);
  }

  let content: ContentWithDetails | undefined;
  try {
    const saveResult = await createContent({ userId: resolvedUserId, url, metadata, tags, memo });
    if (!saveResult.success || !saveResult.data) return { success: false, error: saveResult.error || 'Failed to save', step: 'save', metadata, tags };
    content = saveResult.data;
  } catch (error) {
    console.error('Save content error:', error);
    return { success: false, error: 'Failed to save', step: 'save', metadata, tags };
  }

  return { success: true, content, metadata, tags };
}

export async function saveFromTelegram(url: string, telegramUserId: string, telegramUsername?: string): Promise<SaveContentFlowResult> {
  const userResult = await getOrCreateTelegramUser(telegramUserId, telegramUsername);
  if (!userResult.success || !userResult.data) return { success: false, error: 'Failed to get user', step: 'validation' };
  return saveContentFlow({ url, userId: userResult.data.userId });
}

export function formatTelegramResponse(result: SaveContentFlowResult): string {
  if (!result.success) {
    if (result.error === 'Content already saved') return '⚠️ 이미 저장된 콘텐츠예요!';
    const msgs: Record<string, string> = { validation: '❌ 유효하지 않은 URL', metadata: '❌ 콘텐츠 정보 가져오기 실패', save: '❌ 저장 오류' };
    return msgs[result.step || 'save'] || `❌ ${result.error}`;
  }
  const c = result.content, m = result.metadata, tags = result.tags || [];
  const title = c?.title || m?.title || '제목 없음';
  const platform = c?.platformInfo ? `${c.platformInfo.icon} ${c.platformInfo.displayName}` : `${m?.platformIcon} ${m?.platformDisplayName}`;
  const creator = c?.creator_name || m?.creatorName;
  const tagsLine = tags.length > 0 ? '\n🏷️ ' + tags.slice(0, 5).map(t => `#${t.name.replace(/\s+/g, '_')}`).join(' ') : '';
  return `✅ 저장 완료!\n\n📌 ${title}\n${platform}${creator ? `\n👤 ${creator}` : ''}${tagsLine}\n\nmoah 앱에서 확인하세요.`;
}
