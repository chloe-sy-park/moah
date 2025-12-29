import { NextRequest, NextResponse } from 'next/server';
import { getUserTags } from '@/lib/content';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const result = await getUserTags(userId);
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('GET /api/tags error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
