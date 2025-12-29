import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const platform = searchParams.get('platform');
  const search = searchParams.get('search');
  const tag = searchParams.get('tag');
  
  const offset = (page - 1) * limit;
  
  const supabase = createServiceClient();
  
  let query = supabase
    .from('contents')
    .select(`
      *,
      platform:platforms(*),
      content_tags(tag:tags(*))
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (platform && platform !== 'all') {
    const { data: platformData } = await supabase
      .from('platforms')
      .select('id')
      .eq('name', platform)
      .single();
    
    if (platformData) {
      query = query.eq('platform_id', platformData.id);
    }
  }
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,memo.ilike.%${search}%`);
  }
  
  const { data: contents, error, count } = await query;
  
  if (error) {
    console.error('Failed to fetch contents:', error);
    return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 });
  }
  
  // If tag filter, we need to filter in app since Supabase doesn't support this easily
  let filteredContents = contents || [];
  if (tag) {
    filteredContents = filteredContents.filter(content => 
      content.content_tags?.some((ct: { tag: { name: string } }) => ct.tag?.name === tag)
    );
  }
  
  // Transform the data
  const transformedContents = filteredContents.map(content => ({
    ...content,
    tags: content.content_tags?.map((ct: { tag: unknown }) => ct.tag).filter(Boolean) || [],
    content_tags: undefined,
  }));
  
  return NextResponse.json({
    contents: transformedContents,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
