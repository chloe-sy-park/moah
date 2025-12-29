'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomTabBar } from '@/components/BottomTabBar';

interface User {
  telegram_username: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/?error=login_required');
        } else {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/?error=login_required');
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-text-primary">설정</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile Section */}
        <div className="bg-surface rounded-xl shadow-sm p-6 mb-4">
          <h2 className="text-sm font-medium text-text-tertiary mb-4">프로필</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <p className="font-medium text-text-primary">
                @{user?.telegram_username || 'user'}
              </p>
              <p className="text-sm text-text-tertiary">Telegram 연동됨</p>
            </div>
          </div>
        </div>

        {/* Connection Section */}
        <div className="bg-surface rounded-xl shadow-sm p-6 mb-4">
          <h2 className="text-sm font-medium text-text-tertiary mb-4">연동 상태</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📱</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Telegram</p>
                <p className="text-sm text-green-600">연결됨</p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 text-left text-red-500 hover:bg-red-50 transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* Version */}
        <p className="text-center text-text-tertiary text-xs mt-8">
          moah. v1.0.0
        </p>
      </main>

      <BottomTabBar />
    </div>
  );
}
