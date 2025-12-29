'use client';
import { useState } from 'react';
import type { Platform } from '@/types/database';

interface ContentFiltersProps {
  onFilterChange: (filters: { platform?: Platform; tags?: string[]; search?: string }) => void;
  availableTags?: string[];
  initialFilters?: { platform?: Platform; tags?: string[]; search?: string };
}

export function ContentFilters({ onFilterChange, availableTags = [], initialFilters = {} }: ContentFiltersProps) {
  const [platform, setPlatform] = useState<Platform | undefined>(initialFilters.platform);
  const [search, setSearch] = useState(initialFilters.search || '');

  const handlePlatformChange = (p: Platform | undefined) => {
    setPlatform(p);
    onFilterChange({ platform: p, search });
  };

  const handleSearchChange = (s: string) => {
    setSearch(s);
    onFilterChange({ platform, search: s });
  };

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-white rounded-lg border">
      <input type="text" placeholder="검색..." value={search} onChange={e => handleSearchChange(e.target.value)} className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg" />
      <select value={platform || ''} onChange={e => handlePlatformChange(e.target.value as Platform || undefined)} className="px-3 py-2 border rounded-lg">
        <option value="">전체 플랫폼</option>
        <option value="instagram">Instagram</option>
        <option value="youtube">YouTube</option>
        <option value="tiktok">TikTok</option>
        <option value="twitter">Twitter/X</option>
        <option value="web">Web</option>
      </select>
    </div>
  );
}
