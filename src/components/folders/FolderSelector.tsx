'use client';
import { useState, useEffect } from 'react';

interface Folder { id: string; name: string; icon: string; }

export function FolderSelector({ selectedFolders, onChange }: { selectedFolders: string[]; onChange: (ids: string[]) => void }) {
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    fetch('/api/folders').then(r => r.json()).then(d => d.success && setFolders(d.data || []));
  }, []);

  const toggle = (id: string) => {
    onChange(selectedFolders.includes(id) ? selectedFolders.filter(f => f !== id) : [...selectedFolders, id]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {folders.map(f => (
        <button key={f.id} onClick={() => toggle(f.id)} className={`px-3 py-1.5 rounded-lg border ${selectedFolders.includes(f.id) ? 'bg-primary text-white' : ''}`}>
          {f.icon} {f.name}
        </button>
      ))}
    </div>
  );
}
