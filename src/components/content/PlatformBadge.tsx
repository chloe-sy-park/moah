import type { Platform } from '@/types/database';

const PLATFORM_CONFIG: Record<Platform, { icon: string; label: string; bg: string; text: string }> = {
  instagram: { icon: '📸', label: 'Instagram', bg: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-white' },
  youtube: { icon: '▶️', label: 'YouTube', bg: 'bg-red-500', text: 'text-white' },
  tiktok: { icon: '🎵', label: 'TikTok', bg: 'bg-black', text: 'text-white' },
  twitter: { icon: '𝕏', label: 'X', bg: 'bg-black', text: 'text-white' },
  web: { icon: '🌐', label: 'Web', bg: 'bg-gray-500', text: 'text-white' },
};

export function PlatformBadge({ platform, size = 'md' }: { platform: Platform; size?: 'sm' | 'md' | 'lg' }) {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.web;
  const sizeClasses = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1', lg: 'text-base px-3 py-1.5' };
  return (<span className={`inline-flex items-center gap-1 rounded-full ${config.bg} ${config.text} ${sizeClasses[size]}`}><span>{config.icon}</span><span className="font-medium">{config.label}</span></span>);
}
