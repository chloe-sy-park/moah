import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

interface Tag {
  id: string;
  name: string;
}

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const supabase = createServiceClient();
  
  // Get all tags used by this user's contents
  const { data, error } = await supabase
    .from('content_tags')
    .select(`
      tag:tags(*),
      content:contents!inner(user_id)
    `)
    .eq('content.user_id', user.id);
  
  if (error) {
    console.error('Failed to fetch tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
  
  // Count tags and deduplicate
  const tagCounts = new Map<string, { tag: Tag; count: number }>();
  
  for (const item of data || []) {
    const tag = item.tag as unknown as Tag | null;
    if (tag && tag.id) {
      const tagId = tag.id;
      const existing = tagCounts.get(tagId);
      if (existing) {
        existing.count++;
      } else {
        tagCounts.set(tagId, { tag, count: 1 });
      }
    }
  }
  
  const tags = Array.from(tagCounts.values())
    .sort((a, b) => b.count - a.count)
    .map(({ tag, count }) => ({ ...tag, count }));
  
  return NextResponse.json({ tags });
}
