import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/emailQueueProcessor';

/**
 * POST /api/cron/process-queue
 *
 * Cron endpoint for processing the email queue.
 * Protected by CRON_SECRET environment variable.
 *
 * Configure with Vercel Cron, GitHub Actions, or external cron service:
 * - Recommended frequency: Every 5 minutes
 * - Header: Authorization: Bearer YOUR_CRON_SECRET
 */

export async function POST(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process the queue (default batch size: 50 for cron jobs)
    const result = await processEmailQueue(50);

    return NextResponse.json({
      success: true,
      result: {
        processed: result.processed,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
        errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
      },
    });
  } catch (error) {
    console.error('Error in queue processing cron:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process queue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Support GET for health checks
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET for GET as well
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Queue processing cron endpoint is healthy',
    endpoint: '/api/cron/process-queue',
    method: 'POST',
  });
}
