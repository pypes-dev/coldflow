# Quick Setup Guide - Gmail Email System

## Prerequisites

- Node.js 18.20.2 or 20.9.0+
- PostgreSQL database
- Google Cloud Console account
- pnpm package manager

## Step-by-Step Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API:
   - APIs & Services > Library
   - Search "Gmail API" and enable

4. Create OAuth Credentials:
   - APIs & Services > Credentials
   - Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Add redirect URI: `http://localhost:3000/api/email-accounts/oauth/callback`

5. Configure OAuth Consent Screen:
   - Add scopes:
     - `gmail.send`
     - `gmail.readonly`
     - `userinfo.email`
     - `userinfo.profile`

6. Copy Client ID and Client Secret

### 3. Set Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET

# Generate encryption key:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
GMAIL_ENCRYPTION_KEY=YOUR_GENERATED_KEY

# URLs
GMAIL_OAUTH_REDIRECT_URI=http://localhost:3000/api/email-accounts/oauth/callback
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Database
DATABASE_URL=postgres://user:password@localhost:5432/coldflow
```

### 4. Run Database Migration

```bash
pnpm db:migrate
```

### 5. Start Development Server

```bash
pnpm dev
```

### 6. Test the System

1. Navigate to `http://localhost:3000/dashboard/email-accounts`
2. Click "Connect Gmail Account"
3. Complete OAuth flow
4. Create a test campaign
5. Process queue: `POST http://localhost:3000/api/email-queue/process`

## Production Deployment

### Additional Steps for Production

1. **Update Redirect URI**:
   - Add production URL to Google Cloud Console
   - Update `GMAIL_OAUTH_REDIRECT_URI` in env variables

2. **Set up Cron Jobs**:
   - Token refresh: Every 30 minutes
   - Queue processing: Every 5 minutes

3. **Secure Environment Variables**:
   - Use secrets manager (Vercel Environment Variables, AWS Secrets Manager, etc.)
   - Never commit `.env.local` to version control

4. **Monitor Performance**:
   - Set up logging (Sentry, LogRocket, etc.)
   - Monitor queue depth
   - Track token refresh failures

## Common Issues

### "Redirect URI mismatch"

**Solution**: Ensure the redirect URI in Google Cloud Console exactly matches `GMAIL_OAUTH_REDIRECT_URI`

### "No refresh token"

**Solution**: Users must complete the FULL OAuth flow (not Google One Tap)

### "Encryption key error"

**Solution**: Generate a proper 32-byte base64 key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Next Steps

1. Read [gmail-email-system.md](./gmail-email-system.md) for full documentation
2. Configure cron jobs for production
3. Set up monitoring and alerts
4. Customize email templates
5. Test with real campaigns

## Support

For detailed information, see the [full documentation](./gmail-email-system.md).
