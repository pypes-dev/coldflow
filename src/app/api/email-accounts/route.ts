import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthorizationError } from '@/lib/authorization';
import { getEmailAccountsByUserId } from '@coldflow/db';

/**
 * GET /api/email-accounts
 *
 * List all connected email accounts for the authenticated user.
 * Optionally filter by subAgencyId.
 */

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Get optional subAgencyId from query params
    const searchParams = request.nextUrl.searchParams;
    const subAgencyId = searchParams.get('subAgencyId');

    // Fetch email accounts (tokens are excluded by the query function for security)
    const accounts = await getEmailAccountsByUserId(
      user.id,
      subAgencyId || undefined
    );

    return NextResponse.json({
      success: true,
      accounts: accounts.map(account => ({
        id: account.id,
        email: account.email,
        provider: account.provider,
        status: account.status,
        dailyQuota: account.dailyQuota,
        quotaUsedToday: account.quotaUsedToday,
        quotaResetAt: account.quotaResetAt,
        lastSyncedAt: account.lastSyncedAt,
        errorMessage: account.errorMessage,
        createdAt: account.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching email accounts:', error);

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch email accounts' },
      { status: 500 }
    );
  }
}
