import {
  getAccountsNeedingTokenRefresh,
  updateEmailAccountTokens,
  updateEmailAccountStatus,
} from '@coldflow/db';
import { decryptToken, encryptToken } from './tokenEncryption';
import { refreshAccessToken } from './googleOAuth';

/**
 * Token Refresh Background Job
 *
 * Automatically refreshes OAuth tokens for email accounts that are
 * expiring soon (within 5 minutes).
 */

interface RefreshResult {
  refreshed: number;
  failed: number;
  errors: Array<{ accountId: string; email: string; error: string }>;
}

/**
 * Refresh tokens for all accounts that are expiring soon
 *
 * @returns Summary of refresh operations
 */
export async function refreshExpiringTokens(): Promise<RefreshResult> {
  const result: RefreshResult = {
    refreshed: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get accounts that need token refresh (expiring within 5 minutes)
    const accounts = await getAccountsNeedingTokenRefresh();

    if (accounts.length === 0) {
      console.log('No accounts need token refresh');
      return result;
    }

    console.log(`Refreshing tokens for ${accounts.length} accounts`);

    // Process all accounts concurrently with Promise.allSettled
    // This ensures one failure doesn't block others
    const refreshPromises = accounts.map(async (account) => {
      try {
        if (!account.encryptedRefreshToken) {
          throw new Error('No refresh token available');
        }

        // Decrypt the refresh token
        const refreshToken = decryptToken(account.encryptedRefreshToken);

        // Request new access token from Google
        const tokens = await refreshAccessToken(refreshToken);

        // Encrypt the new access token
        const encryptedAccessToken = encryptToken(tokens.accessToken);

        // Update account with new token and expiry
        await updateEmailAccountTokens(
          account.id,
          encryptedAccessToken,
          account.encryptedRefreshToken, // Keep same refresh token
          new Date(tokens.expiryDate)
        );

        // Update status to connected if it was in error state
        if (account.status === 'error') {
          await updateEmailAccountStatus(account.id, 'connected', null);
        }

        console.log(`Token refreshed successfully for account: ${account.email}`);
        result.refreshed++;
      } catch (error) {
        console.error(`Failed to refresh token for account ${account.email}:`, error);

        // Check if refresh token was revoked
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isRevoked = errorMessage.includes('revoked') || errorMessage.includes('invalid_grant');

        // Update account status to disconnected if token was revoked, otherwise error
        await updateEmailAccountStatus(
          account.id,
          isRevoked ? 'disconnected' : 'error',
          `Token refresh failed: ${errorMessage}`
        );

        result.failed++;
        result.errors.push({
          accountId: account.id,
          email: account.email,
          error: errorMessage,
        });
      }
    });

    // Wait for all refresh operations to complete
    await Promise.allSettled(refreshPromises);

    console.log('Token refresh summary:', {
      refreshed: result.refreshed,
      failed: result.failed,
      totalProcessed: accounts.length,
    });

    return result;
  } catch (error) {
    console.error('Fatal error in token refresh job:', error);
    throw error;
  }
}

/**
 * Get count of accounts that need token refresh
 * Useful for monitoring
 */
export async function getRefreshQueueSize(): Promise<number> {
  const accounts = await getAccountsNeedingTokenRefresh();
  return accounts.length;
}
