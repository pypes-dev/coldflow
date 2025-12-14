import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import {
  getEmailAccountById,
  updateEmailAccountTokens,
  updateEmailAccountStatus,
  incrementEmailAccountQuota,
} from '@coldflow/db';
import { decryptToken, encryptToken } from './tokenEncryption';
import { refreshAccessToken, getOAuth2Client } from './googleOAuth';

/**
 * Gmail API Service
 *
 * Handles sending emails via Gmail API with automatic token refresh
 * and tracking pixel/link injection.
 */

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  bodyHtml?: string;
  bodyText: string;
  trackingId: string;
  fromName?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Construct a MIME email message with HTML and plain text parts
 */
function createMimeMessage(options: SendEmailOptions, fromEmail: string): string {
  const boundary = '----=_Part_' + Date.now();
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

  // Inject tracking pixel into HTML body
  let htmlBody = options.bodyHtml || '';
  if (htmlBody && options.trackingId) {
    const trackingPixel = `<img src="${baseUrl}/api/email-tracking/pixel/${options.trackingId}.png" width="1" height="1" alt="" style="display:none;" />`;
    // Insert tracking pixel before closing body tag, or at the end if no body tag
    if (htmlBody.includes('</body>')) {
      htmlBody = htmlBody.replace('</body>', `${trackingPixel}</body>`);
    } else {
      htmlBody += trackingPixel;
    }

    // Wrap links with click tracking redirects
    // Match href attributes in anchor tags
    const linkRegex = /<a\s+([^>]*\s+)?href=["']([^"']+)["']/gi;
    htmlBody = htmlBody.replace(linkRegex, (match, attrs, url) => {
      // Skip if already a tracking URL
      if (url.includes('/api/email-tracking/click/')) {
        return match;
      }

      const trackingUrl = `${baseUrl}/api/email-tracking/click/${options.trackingId}?url=${encodeURIComponent(url)}`;
      return `<a ${attrs || ''}href="${trackingUrl}"`;
    });
  }

  // Build MIME message
  const messageParts = [
    `From: ${options.fromName ? `"${options.fromName}" <${fromEmail}>` : fromEmail}`,
    `To: ${options.toName ? `"${options.toName}" <${options.to}>` : options.to}`,
    `Subject: ${options.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    options.bodyText,
    '',
  ];

  // Add HTML part if provided
  if (htmlBody) {
    messageParts.push(
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlBody,
      ''
    );
  }

  messageParts.push(`--${boundary}--`);

  const message = messageParts.join('\r\n');

  // Encode to base64url (Gmail API requirement)
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send an email via Gmail API
 *
 * @param emailAccountId - The email account to send from
 * @param options - Email content and recipient info
 * @returns Result with success status and message ID
 */
export async function sendEmail(
  emailAccountId: string,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    // Fetch email account from database
    const account = await getEmailAccountById(emailAccountId);

    if (!account) {
      return {
        success: false,
        error: 'Email account not found',
      };
    }

    if (account.status !== 'connected') {
      return {
        success: false,
        error: `Email account is ${account.status}. Please reconnect.`,
      };
    }

    if (!account.encryptedAccessToken || !account.encryptedRefreshToken) {
      return {
        success: false,
        error: 'No OAuth tokens found. Please reconnect the account.',
      };
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    const now = new Date();
    const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt) : new Date(0);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    let accessToken: string;

    if (expiresAt < fiveMinutesFromNow) {
      // Token expired or expiring soon - refresh it
      try {
        const refreshToken = decryptToken(account.encryptedRefreshToken);
        const newTokens = await refreshAccessToken(refreshToken);

        // Encrypt and store new access token
        const encryptedAccessToken = encryptToken(newTokens.accessToken);
        await updateEmailAccountTokens(
          emailAccountId,
          encryptedAccessToken,
          account.encryptedRefreshToken,
          new Date(newTokens.expiryDate)
        );

        accessToken = newTokens.accessToken;

        // Update status to connected if it was in error
        if (account.status === 'error') {
          await updateEmailAccountStatus(emailAccountId, 'connected', null);
        }
      } catch (error) {
        // Token refresh failed - mark account as error
        await updateEmailAccountStatus(
          emailAccountId,
          'error',
          `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        return {
          success: false,
          error: 'Failed to refresh access token. Please reconnect the account.',
        };
      }
    } else {
      // Token is still valid - decrypt and use it
      accessToken = decryptToken(account.encryptedAccessToken);
    }

    // Create OAuth2 client with access token
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create MIME message
    const raw = createMimeMessage(options, account.email);

    // Send email via Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });

    if (!response.data.id) {
      return {
        success: false,
        error: 'No message ID returned from Gmail API',
      };
    }

    // Update quota usage
    await incrementEmailAccountQuota(emailAccountId);

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error('Gmail send error:', error);

    // Check for quota exceeded error
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return {
          success: false,
          error: 'Daily sending quota exceeded. Please try again tomorrow.',
        };
      }

      if (error.message.includes('authentication') || error.message.includes('invalid_grant')) {
        return {
          success: false,
          error: 'Authentication failed. Please reconnect the account.',
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
}

/**
 * Check if an email account has available quota
 */
export async function hasAvailableQuota(emailAccountId: string): Promise<boolean> {
  const account = await getEmailAccountById(emailAccountId);

  if (!account) return false;

  // Check if quota needs to be reset (new day)
  const now = new Date();
  const resetAt = account.quotaResetAt ? new Date(account.quotaResetAt) : null;

  if (resetAt && now >= resetAt) {
    // Quota should be reset - this will be handled by a background job
    // For now, assume quota is available
    return true;
  }

  return account.quotaUsedToday < account.dailyQuota;
}
