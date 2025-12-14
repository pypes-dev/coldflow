import { NextRequest, NextResponse } from 'next/server';
import { refreshExpiringTokens } from '@/lib/tokenRefreshJob';

/**
 * POST /api/cron/refresh-tokens
 *
 * Cron endpoint for refreshing expiring OAuth tokens.
 * Protected by CRON_SECRET environment variable.
 *
 * Configure with Vercel Cron, GitHub Actions, or external cron service:
 * - Recommended frequency: Every 30 minutes
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

    // Refresh expiring tokens
    const result = await refreshExpiringTokens();

    return NextResponse.json({
      success: true,
      result: {
        refreshed: result.refreshed,
        failed: result.failed,
        errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
      },
    });
  } catch (error) {
    console.error('Error in token refresh cron:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh tokens',
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
    message: 'Token refresh cron endpoint is healthy',
    endpoint: '/api/cron/refresh-tokens',
    method: 'POST',
  });
}
