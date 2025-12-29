'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return start + i;
  }).filter(p => p >= 1 && p <= totalPages);

  return (
    <nav className="flex items-center justify-center gap-2 py-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 rounded-lg border disabled:opacity-50">이전</button>
      {pages.map(page => (
        <button key={page} onClick={() => onPageChange(page)} className={`px-3 py-2 rounded-lg border ${currentPage === page ? 'bg-primary text-white' : ''}`}>{page}</button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 rounded-lg border disabled:opacity-50">다음</button>
    </nav>
  );
}
