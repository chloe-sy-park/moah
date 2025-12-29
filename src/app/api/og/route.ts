import { NextRequest, NextResponse } from 'next/server';
import { extractMetadata, isValidUrl } from '@/lib/og-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    if (!url || !isValidUrl(url)) return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
    const metadata = await extractMetadata(url);
    if (!metadata) return NextResponse.json({ success: false, error: 'Failed to extract metadata' }, { status: 500 });
    return NextResponse.json({ success: true, data: metadata });
  } catch (error) {
    console.error('POST /api/og error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
