'use client';

import { useState, useEffect, useCallback } from 'react';
import { SessionUser } from '@/lib/auth';
import { Header } from '@/components/Header';
import { BottomTabBar } from '@/components/BottomTabBar';

interface Platform {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  color_bg: string;
  color_text: string;
}

interface Tag {
  id: string;
  name: string;
  count?: number;
}

interface Content {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  creator_name: string | null;
  memo: string | null;
  saved_at: string;
  platform: Platform;
  tags: Tag[];
}

interface DashboardClientProps {
  user: SessionUser;
}

const TELEGRAM_BOT_URL = 'https://t.me/Moah_sass_bot';

export function DashboardClient({ user }: DashboardClientProps) {
  const [contents, setContents] = useState<Content[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (platform !== 'all') params.set('platform', platform);
      if (search) params.set('search', search);
      if (selectedTag) params.set('tag', selectedTag);

      const res = await fetch(`/api/contents?${params}`);
      const data = await res.json();
      setContents(data.contents || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    } finally {
      setLoading(false);
    }
  }, [page, platform, search, selectedTag]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제할까요?')) return;
    try {
      await fetch(`/api/contents/${id}`, { method: 'DELETE' });
      fetchContents();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch('');
    setPlatform('all');
    setSelectedTag(null);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const platforms = [
    { name: 'all', display: '전체', icon: '🌐' },
    { name: 'instagram', display: 'Instagram', icon: '📷' },
    { name: 'youtube', display: 'YouTube', icon: '🎬' },
    { name: 'tiktok', display: 'TikTok', icon: '🎵' },
    { name: 'twitter', display: 'X', icon: '🐦' },
    { name: 'web', display: 'Web', icon: '🔗' },
  ];

  // Check if any filter is active
  const hasActiveFilters = search || platform !== 'all' || selectedTag;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header with Search */}
      <Header 
        username={user.telegram_username}
        searchValue={search}
        onSearchChange={handleSearchChange}
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Mobile Search */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="검색..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-xl shadow-sm p-4 mb-6">
          {/* Active Filters - Show when any filter is applied */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap mb-4 pb-4 border-b border-border">
              <span className="text-xs text-text-tertiary">적용된 필터:</span>
              
              {/* Search filter tag */}
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  &quot;{search}&quot;
                  <button 
                    onClick={() => { setSearch(''); setPage(1); }}
                    className="ml-0.5 hover:text-primary-900 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {/* Platform filter tag */}
              {platform !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {platforms.find(p => p.name === platform)?.icon} {platforms.find(p => p.name === platform)?.display}
                  <button 
                    onClick={() => { setPlatform('all'); setPage(1); }}
                    className="ml-0.5 hover:text-blue-900 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {/* Tag filter tag */}
              {selectedTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                  #{selectedTag}
                  <button 
                    onClick={() => { setSelectedTag(null); setPage(1); }}
                    className="ml-0.5 hover:text-green-900 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {/* Clear all button */}
              <button 
                onClick={clearAllFilters}
                className="text-xs text-text-tertiary hover:text-text-secondary transition-colors ml-auto"
              >
                모두 초기화
              </button>
            </div>
          )}

          {/* Platform Filter - Horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 md:flex-wrap scrollbar-hide -mx-1 px-1">
            {platforms.map((p) => (
              <button
                key={p.name}
                onClick={() => { setPlatform(p.name); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  platform === p.name
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {p.icon} {p.display}
              </button>
            ))}
          </div>

          {/* Tags - Also horizontal scroll on mobile */}
          {tags.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 md:pb-0 md:flex-wrap scrollbar-hide -mx-1 px-1">
              <button
                onClick={() => { setSelectedTag(null); setPage(1); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  !selectedTag
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                모든 태그
              </button>
              {tags.slice(0, 15).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => { setSelectedTag(tag.name); setPage(1); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    selectedTag === tag.name
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  #{tag.name} {tag.count && <span className="opacity-60">({tag.count})</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            {hasActiveFilters ? (
              <>
                <p className="text-text-secondary text-lg font-medium">검색 결과가 없어요</p>
                <p className="text-text-tertiary mt-2 mb-6">다른 검색어나 필터를 시도해보세요</p>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-text-secondary font-medium rounded-lg transition-colors"
                >
                  필터 초기화
                </button>
              </>
            ) : (
              <>
                <p className="text-text-secondary text-lg font-medium">저장된 콘텐츠가 없어요</p>
                <p className="text-text-tertiary mt-2 mb-6">Telegram 봇에서 URL을 보내보세요!</p>
                <a
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram 봇 열기
                </a>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {contents.map((content) => (
                <div
                  key={content.id}
                  className="bg-surface rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all group"
                >
                  {/* Thumbnail */}
                  <a href={content.url} target="_blank" rel="noopener noreferrer">
                    <div className="aspect-video bg-gray-100 relative">
                      {content.thumbnail_url ? (
                        <img
                          src={content.thumbnail_url}
                          alt={content.title || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        /* No thumbnail - show description preview or icon */
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                          {content.description ? (
                            <p className="text-xs text-text-secondary line-clamp-4 text-center leading-relaxed">
                              {content.description}
                            </p>
                          ) : (
                            <span className="text-4xl opacity-50">
                              {content.platform?.icon || '🔗'}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Platform badge */}
                      <span
                        className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium shadow-sm"
                        style={{
                          backgroundColor: content.platform?.color_bg || '#6B7280',
                          color: content.platform?.color_text || '#FFFFFF',
                        }}
                      >
                        {content.platform?.display_name || 'Web'}
                      </span>
                    </div>
                  </a>

                  {/* Content info */}
                  <div className="p-3">
                    <a href={content.url} target="_blank" rel="noopener noreferrer">
                      <h3 className="font-medium text-sm line-clamp-2 text-text-primary hover:text-primary transition-colors">
                        {content.title || content.url}
                      </h3>
                    </a>
                    
                    {/* Description - show if thumbnail exists (so it wasn't shown above) */}
                    {content.thumbnail_url && content.description && (
                      <p className="text-xs text-text-tertiary mt-1.5 line-clamp-2">
                        {content.description}
                      </p>
                    )}
                    
                    {content.creator_name && (
                      <p className="text-xs text-text-tertiary mt-1">{content.creator_name}</p>
                    )}

                    {/* Tags */}
                    {content.tags && content.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {content.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            onClick={() => { setSelectedTag(tag.name); setPage(1); }}
                            className="text-xs text-primary cursor-pointer hover:text-primary-700 transition-colors"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-border">
                      <span className="text-xs text-text-tertiary">{formatDate(content.saved_at)}</span>
                      <button
                        onClick={() => handleDelete(content.id)}
                        className="text-xs text-text-tertiary hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-text-secondary">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Tab Bar - Mobile Only */}
      <BottomTabBar />
    </div>
  );
}
