'use client';
import Link from 'next/link';

export interface FolderCardData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  contentCount: number;
  isDefault: boolean;
}

export function FolderCard({ folder, onEdit, onDelete }: { folder: FolderCardData; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <Link href={`/folders/${folder.id}`} className="block p-4 bg-white rounded-xl border hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" style={{ color: folder.color }}>{folder.icon}</span>
          <div>
            <h3 className="font-semibold">{folder.name}</h3>
            {folder.description && <p className="text-sm text-gray-500 line-clamp-1">{folder.description}</p>}
          </div>
        </div>
        <span className="text-sm text-gray-400">{folder.contentCount}개</span>
      </div>
    </Link>
  );
}
