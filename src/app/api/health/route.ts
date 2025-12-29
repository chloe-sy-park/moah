import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const startTime = Date.now();

export async function GET() {
  try {
    const supabase = createServiceClient();
    const start = Date.now();
    const { error } = await supabase.from('platforms').select('id').limit(1);
    const latency = Date.now() - start;

    if (error) throw error;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'moah',
      uptime: Math.round((Date.now() - startTime) / 1000),
      checks: {
        database: { status: 'pass', latencyMs: latency },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    );
  }
}
