import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { google } from 'googleapis';

/**
 * Google OAuth Helper Utilities
 *
 * IMPORTANT NOTE: Google One Tap returns an ID token (JWT), not an authorization code.
 * ID tokens cannot be exchanged for refresh tokens. For email sending with Gmail API,
 * we need a full OAuth flow with offline access to get refresh tokens.
 *
 * This implementation provides two approaches:
 * 1. Verify One Tap credentials (for user identification)
 * 2. Full OAuth flow with authorization code (for Gmail API access with refresh tokens)
 */

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Get OAuth configuration from environment variables
 */
function getOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_OAUTH_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/email-accounts/oauth/callback`;

  if (!clientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
  }

  if (!clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET is not configured');
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Create an OAuth2 client
 */
export function getOAuth2Client(): OAuth2Client {
  const config = getOAuthConfig();
  return new OAuth2Client(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

/**
 * Verify a Google ID token (from One Tap or regular sign-in)
 *
 * @param credential - The ID token JWT from Google
 * @returns Verified token payload with user info
 */
export async function verifyGoogleCredential(credential: string): Promise<TokenPayload> {
  try {
    const config = getOAuthConfig();
    const client = new OAuth2Client(config.clientId);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Failed to extract payload from ID token');
    }

    if (!payload.email) {
      throw new Error('Email not present in token payload');
    }

    return payload;
  } catch (error) {
    throw new Error(
      `Failed to verify Google credential: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate an OAuth authorization URL for full Gmail API access
 *
 * This is needed because One Tap doesn't provide refresh tokens.
 * Users must go through the full OAuth consent screen to grant
 * offline access for email sending.
 *
 * @param state - Optional state parameter for CSRF protection
 * @returns Authorization URL to redirect the user to
 */
export function getGmailAuthorizationUrl(state?: string): string {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required for refresh token
    scope: scopes,
    state: state,
    prompt: 'consent', // Force consent screen to ensure refresh token is issued
  });
}

/**
 * Exchange an authorization code for access and refresh tokens
 *
 * @param code - Authorization code from OAuth callback
 * @returns Object containing access token, refresh token, and expiry
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  scope: string;
}> {
  try {
    const oauth2Client = getOAuth2Client();

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token returned from Google');
    }

    if (!tokens.refresh_token) {
      throw new Error(
        'No refresh token returned from Google. Ensure access_type=offline and prompt=consent are set.'
      );
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date || Date.now() + 3600 * 1000, // Default 1 hour
      scope: tokens.scope || '',
    };
  } catch (error) {
    throw new Error(
      `Failed to exchange authorization code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Refresh an access token using a refresh token
 *
 * @param refreshToken - The refresh token
 * @returns New access token and expiry date
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiryDate: number;
}> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('No access token returned from token refresh');
    }

    return {
      accessToken: credentials.access_token,
      expiryDate: credentials.expiry_date || Date.now() + 3600 * 1000,
    };
  } catch (error) {
    // Check if refresh token was revoked
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      throw new Error('Refresh token has been revoked or expired. User must re-authenticate.');
    }

    throw new Error(
      `Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get user info from an access token
 *
 * @param accessToken - The access token
 * @returns User email and profile information
 */
export async function getUserInfo(accessToken: string): Promise<{
  email: string;
  name?: string;
  picture?: string;
}> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      throw new Error('Email not found in user info');
    }

    return {
      email: data.email,
      name: data.name || undefined,
      picture: data.picture || undefined,
    };
  } catch (error) {
    throw new Error(
      `Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Revoke a token (access or refresh)
 *
 * @param token - The token to revoke
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    const oauth2Client = getOAuth2Client();
    await oauth2Client.revokeToken(token);
  } catch (error) {
    throw new Error(
      `Failed to revoke token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
