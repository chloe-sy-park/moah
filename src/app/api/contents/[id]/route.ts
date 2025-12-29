import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id } = await params;
  const supabase = createServiceClient();
  
  const { data: content, error } = await supabase
    .from('contents')
    .select(`*, platform:platforms(*), content_tags(tag:tags(*))`)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (error || !content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }
  
  return NextResponse.json({
    ...content,
    tags: content.content_tags?.map((ct: { tag: unknown }) => ct.tag) || [],
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id } = await params;
  const supabase = createServiceClient();
  
  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  
  if (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
  
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceClient();
  
  const updateData: Record<string, unknown> = {};
  if (body.memo !== undefined) updateData.memo = body.memo;
  if (body.title !== undefined) updateData.title = body.title;
  updateData.updated_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('contents')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
