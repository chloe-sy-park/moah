'use client';
import { useState } from 'react';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; color?: string; icon?: string }) => void;
  initialData?: { name: string; description?: string; color?: string; icon?: string };
  title?: string;
}

export function FolderModal({ isOpen, onClose, onSubmit, initialData, title = '새 폴더' }: FolderModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="폴더 이름" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-3" required />
          <textarea placeholder="설명 (선택)" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-4" rows={2} />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">취소</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}
