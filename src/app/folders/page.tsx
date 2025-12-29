import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { BottomTabBar } from '@/components/BottomTabBar';

export default async function FoldersPage() {
  const user = await getSession();
  
  if (!user) {
    redirect('/?error=login_required');
  }
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-text-primary">폴더</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-text-secondary text-lg">폴더 기능 준비 중</p>
          <p className="text-text-tertiary mt-2">곧 콘텐츠를 폴더로 정리할 수 있어요!</p>
        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}
