import { NextRequest, NextResponse } from 'next/server';
import { getContents, saveContentFlow, type ContentFilters, type PaginationOptions } from '@/lib/content';
import type { Platform } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const filters: ContentFilters = {};
    const platform = searchParams.get('platform');
    if (platform && ['instagram', 'youtube', 'tiktok', 'twitter', 'web'].includes(platform)) filters.platform = platform as Platform;
    const tags = searchParams.get('tags');
    if (tags) filters.tags = tags.split(',').map(t => t.trim());
    const search = searchParams.get('search');
    if (search) filters.search = search;

    const pagination: PaginationOptions = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100),
      sortBy: (searchParams.get('sort_by') as PaginationOptions['sortBy']) || 'saved_at',
      sortOrder: (searchParams.get('sort_order') as PaginationOptions['sortOrder']) || 'desc',
    };

    const result = await getContents(userId, filters, pagination);
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: result.data?.data, pagination: result.data?.pagination });
  } catch (error) {
    console.error('GET /api/contents error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { url, memo } = body;
    if (!url) return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    const result = await saveContentFlow({ url, userId, memo });
    if (!result.success) {
      const status = result.error === 'Content already saved' ? 409 : 500;
      return NextResponse.json({ success: false, error: result.error, step: result.step }, { status });
    }
    return NextResponse.json({ success: true, data: result.content, tags: result.tags }, { status: 201 });
  } catch (error) {
    console.error('POST /api/contents error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
