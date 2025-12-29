import { NextRequest, NextResponse } from 'next/server';
import { generateTags, type TaggingInput } from '@/lib/tagging';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, platform, contentType, creatorName, url } = body;
    if (!url) return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    const input: TaggingInput = { title, description, platform: platform || 'Web', contentType: contentType || 'content', creatorName, url };
    const result = await generateTags(input);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('POST /api/tagging error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
