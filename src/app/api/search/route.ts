import { NextRequest, NextResponse } from 'next/server';
import { searchContents, type SearchOptions } from '@/lib/search';
import type { Platform } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const options: SearchOptions = {
      query: searchParams.get('q') || '',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100),
      sortBy: (searchParams.get('sort_by') as SearchOptions['sortBy']) || 'saved_at',
      sortOrder: (searchParams.get('sort_order') as SearchOptions['sortOrder']) || 'desc',
    };
    const platform = searchParams.get('platform');
    if (platform && ['instagram', 'youtube', 'tiktok', 'twitter', 'web'].includes(platform)) {
      options.platform = platform as Platform;
    }
    const tags = searchParams.get('tags');
    if (tags) options.tags = tags.split(',').map(t => t.trim());
    const startDate = searchParams.get('start_date');
    if (startDate) options.startDate = startDate;
    const endDate = searchParams.get('end_date');
    if (endDate) options.endDate = endDate;

    const result = await searchContents(userId, options);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
