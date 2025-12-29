import { NextRequest, NextResponse } from 'next/server';
import { addContentsToFolder, removeContentsFromFolder } from '@/lib/folders';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content_ids } = body;
    if (!content_ids?.length) return NextResponse.json({ success: false, error: 'content_ids required' }, { status: 400 });
    const result = await addContentsToFolder(id, content_ids);
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, added: result.added });
  } catch (error) {
    console.error('POST /api/folders/[id]/contents error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content_ids } = body;
    if (!content_ids?.length) return NextResponse.json({ success: false, error: 'content_ids required' }, { status: 400 });
    const result = await removeContentsFromFolder(id, content_ids);
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, removed: result.removed });
  } catch (error) {
    console.error('DELETE /api/folders/[id]/contents error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
