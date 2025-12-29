'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { PlatformBadge } from './PlatformBadge';
import type { Platform } from '@/types/database';

export interface GridCardData {
  id: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  url: string;
  platform: Platform;
  creatorName: string | null;
  tags: { id: string; name: string }[];
  savedAt: string;
  memo: string | null;
}

interface GridCardProps {
  content: GridCardData;
  onTagClick?: (tag: string) => void;
  onDelete?: (id: string) => void;
  priority?: boolean;
}

function formatRelativeTime(dateString: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${Math.floor(diffDays / 30)}개월 전`;
}

export function GridCard({ content, onTagClick, onDelete, priority = false }: GridCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <article className="group relative bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {content.thumbnailUrl && !imageError ? (
          <Image src={content.thumbnailUrl} alt={content.title || ''} fill sizes="(max-width: 640px) 100vw, 25vw" className={`object-cover transition-transform ${isHovered ? 'scale-105' : ''}`} priority={priority} onError={() => setImageError(true)} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200"><span className="text-4xl opacity-30">📸</span></div>
        )}
        <div className="absolute top-3 left-3"><PlatformBadge platform={content.platform} size="sm" /></div>
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3">
            <button onClick={() => window.open(content.url, '_blank')} className="p-2 bg-white rounded-full">🔗</button>
            {onDelete && <button onClick={() => onDelete(content.id)} className="p-2 bg-white rounded-full text-red-500">🗑️</button>}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{content.title || '제목 없음'}</h3>
        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {content.tags.slice(0, 3).map(tag => (<button key={tag.id} onClick={() => onTagClick?.(tag.name)} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 hover:bg-primary/10">#{tag.name}</button>))}
          </div>
        )}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="truncate">{content.creatorName || '알 수 없음'}</span>
          <time dateTime={content.savedAt}>{formatRelativeTime(content.savedAt)}</time>
        </div>
      </div>
      <Link href={`/contents/${content.id}`} className="absolute inset-0 z-0"><span className="sr-only">상세보기</span></Link>
    </article>
  );
}

export function GridCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-4"><div className="h-5 bg-gray-200 rounded mb-2" /><div className="h-5 bg-gray-200 rounded w-3/4 mb-3" /></div>
    </div>
  );
}
