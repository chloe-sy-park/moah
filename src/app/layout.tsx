import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'moah. | 저장만 해. 정리는 우리가 할게.',
  description: 'SNS 콘텐츠 레퍼런스 수집에 특화된 올인원 북마크 서비스',
  keywords: ['북마크', '레퍼런스', '인스타그램', '유튜브', '틱톡', '무드보드'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF6B6B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
