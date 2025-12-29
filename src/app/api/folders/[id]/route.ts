import { NextRequest, NextResponse } from 'next/server';
import { getFolderWithContents, updateFolder, deleteFolder } from '@/lib/folders';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const result = await getFolderWithContents(id, { page, limit });
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    return NextResponse.json({ success: true, data: result.folder });
  } catch (error) {
    console.error('GET /api/folders/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const result = await updateFolder(id, userId, body);
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    return NextResponse.json({ success: true, data: result.folder });
  } catch (error) {
    console.error('PATCH /api/folders/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const result = await deleteFolder(id, userId);
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/folders/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
