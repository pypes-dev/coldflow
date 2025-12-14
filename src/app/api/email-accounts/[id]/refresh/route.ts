import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthorizationError } from '@/lib/authorization';
import {
  getEmailAccountById,
  updateEmailAccountTokens,
  updateEmailAccountStatus,
} from '@coldflow/db';
import { decryptToken, encryptToken } from '@/lib/tokenEncryption';
import { refreshAccessToken } from '@/lib/googleOAuth';

/**
 * POST /api/email-accounts/[id]/refresh
 *
 * Manually trigger token refresh for an email account.
 * Useful for testing or recovering from token expiry issues.
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const user = await requireAuth();

    // Fetch account
    const account = await getEmailAccountById(id);

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Email account not found' },
        { status: 404 }
      );
    }

    if (account.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to refresh this account' },
        { status: 403 }
      );
    }

    // Check if account has encrypted refresh token
    if (!account.encryptedRefreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'No refresh token available. Please reconnect the account.',
        },
        { status: 400 }
      );
    }

    try {
      // Decrypt the refresh token
      const refreshToken = decryptToken(account.encryptedRefreshToken);

      // Request new access token from Google
      const tokens = await refreshAccessToken(refreshToken);

      // Encrypt the new access token
      const encryptedAccessToken = encryptToken(tokens.accessToken);

      // Update account with new token and expiry
      await updateEmailAccountTokens(
        id,
        encryptedAccessToken,
        account.encryptedRefreshToken, // Keep same refresh token
        new Date(tokens.expiryDate)
      );

      // Update status to connected if it was in error state
      if (account.status === 'error') {
        await updateEmailAccountStatus(id, 'connected', null);
      }

      return NextResponse.json({
        success: true,
        message: 'Token refreshed successfully',
        expiresAt: new Date(tokens.expiryDate),
      });
    } catch (error) {
      // Check if refresh token was revoked
      if (error instanceof Error && error.message.includes('revoked')) {
        await updateEmailAccountStatus(
          id,
          'error',
          'Refresh token revoked. Please reconnect your account.'
        );

        return NextResponse.json(
          {
            success: false,
            error: 'Refresh token has been revoked. Please reconnect your account.',
          },
          { status: 401 }
        );
      }

      // Update account status to error
      await updateEmailAccountStatus(
        id,
        'error',
        `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      throw error;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
