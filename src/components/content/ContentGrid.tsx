'use client';
import { GridCard, GridCardSkeleton, type GridCardData } from './GridCard';

interface ContentGridProps {
  contents: GridCardData[];
  isLoading?: boolean;
  onTagClick?: (tag: string) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export function ContentGrid({ contents, isLoading = false, onTagClick, onDelete, emptyMessage = '저장된 콘텐츠가 없습니다.' }: ContentGridProps) {
  if (isLoading) {
    return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => (<GridCardSkeleton key={i} />))}</div>);
  }
  if (contents.length === 0) {
    return (<div className="flex flex-col items-center justify-center py-16"><div className="text-6xl mb-4">📭</div><p className="text-gray-500">{emptyMessage}</p></div>);
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {contents.map((content, index) => (<GridCard key={content.id} content={content} onTagClick={onTagClick} onDelete={onDelete} priority={index < 4} />))}
    </div>
  );
}

export function ContentGridCompact({ contents, isLoading = false, onTagClick }: Omit<ContentGridProps, 'onDelete' | 'emptyMessage'>) {
  if (isLoading) return (<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => (<GridCardSkeleton key={i} />))}</div>);
  return (<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{contents.map(content => (<GridCard key={content.id} content={content} onTagClick={onTagClick} />))}</div>);
}
