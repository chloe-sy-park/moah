'use client';

import { useState, useEffect, useCallback } from 'react';
import { SessionUser } from '@/lib/auth';

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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text-primary">moah.</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">@{user.telegram_username || 'user'}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-text-secondary hover:text-primary transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-surface rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="검색..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 min-w-[200px] px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            
            {/* Platform Filter */}
            <div className="flex gap-2 flex-wrap">
              {platforms.map((p) => (
                <button
                  key={p.name}
                  onClick={() => { setPlatform(p.name); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    platform === p.name
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {p.icon} {p.display}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={() => { setSelectedTag(null); setPage(1); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
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
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
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
            <p className="text-text-secondary text-lg">저장된 콘텐츠가 없어요</p>
            <p className="text-text-tertiary mt-2">Telegram 봇에서 URL을 보내보세요!</p>
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
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-50">
                          {content.platform?.icon || '🔗'}
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
                        className="text-xs text-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
    </div>
  );
}
