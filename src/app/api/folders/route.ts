import { NextRequest, NextResponse } from 'next/server';
import { getUserFolders, createFolder } from '@/lib/folders';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const result = await getUserFolders(userId);
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: result.folders });
  } catch (error) {
    console.error('GET /api/folders error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { name, description, color, icon } = body;
    if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    const result = await createFolder(userId, { name, description, color, icon });
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, data: result.folder }, { status: 201 });
  } catch (error) {
    console.error('POST /api/folders error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
