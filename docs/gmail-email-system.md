# Gmail OAuth Cold Email Sending System

## Overview

This document provides comprehensive information about the Gmail-based cold email sending system implemented in Coldflow. The system enables users to connect their Gmail accounts, send cold emails at scale, track engagement metrics, and manage campaigns.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Setup & Configuration](#setup--configuration)
5. [OAuth Flow](#oauth-flow)
6. [Email Sending Process](#email-sending-process)
7. [Tracking System](#tracking-system)
8. [Background Jobs](#background-jobs)
9. [Security Considerations](#security-considerations)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Components

The email system consists of the following major components:

1. **OAuth & Token Management**: Secure storage and automatic refresh of Gmail OAuth tokens
2. **Email Account Management**: API endpoints for connecting, listing, and managing email accounts
3. **Campaign Management**: Create and manage email campaigns with multiple recipients
4. **Email Queue**: PostgreSQL-based queue for reliable email delivery
5. **Gmail API Integration**: Send emails via Gmail API with tracking
6. **Tracking System**: Pixel-based open tracking and click tracking
7. **Background Jobs**: Automated token refresh and queue processing

### Technology Stack

- **Frontend**: React 18, TypeScript, Next.js 15
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Email API**: Gmail API (googleapis package)
- **OAuth**: Google OAuth 2.0 (google-auth-library)
- **Encryption**: AES-256-GCM (Node.js crypto module)

---

## Database Schema

### Tables

#### `email_account`

Stores connected email accounts with encrypted OAuth tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| user_id | text | Reference to user table |
| sub_agency_id | text | Optional reference to sub_agency |
| email | text | Email address |
| provider | enum | Email provider (gmail, outlook, imap) |
| encrypted_access_token | text | AES-256-GCM encrypted access token |
| encrypted_refresh_token | text | AES-256-GCM encrypted refresh token |
| token_expires_at | timestamp | When the access token expires |
| scopes | text | OAuth scopes granted |
| status | enum | connected/disconnected/error |
| daily_quota | integer | Daily sending limit (default: 500) |
| quota_used_today | integer | Emails sent today |
| quota_reset_at | timestamp | When quota resets (midnight UTC) |
| last_synced_at | timestamp | Last sync with Gmail |
| error_message | text | Error details if status is error |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

#### `email_campaign`

Tracks email campaigns.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| user_id | text | Reference to user |
| sub_agency_id | text | Optional sub-agency |
| name | text | Campaign name |
| status | enum | draft/scheduled/sending/completed/paused |
| total_recipients | integer | Total number of recipients |
| sent_count | integer | Successfully sent emails |
| open_count | integer | Unique opens |
| click_count | integer | Unique clicks |
| reply_count | integer | Replies received |
| bounce_count | integer | Bounced emails |
| unsubscribe_count | integer | Unsubscribes |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

#### `email_queue`

Queue of emails to be sent.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| campaign_id | text | Reference to email_campaign |
| email_account_id | text | Account to send from |
| recipient_email | text | Recipient email address |
| recipient_name | text | Recipient name (optional) |
| subject | text | Email subject |
| body_html | text | HTML body (optional) |
| body_text | text | Plain text body |
| scheduled_for | timestamp | When to send |
| status | enum | pending/processing/sent/failed/bounced |
| priority | integer | Priority (0-10, higher = more important) |
| attempt_count | integer | Number of send attempts |
| max_attempts | integer | Maximum retry attempts |
| last_attempt_at | timestamp | Last send attempt |
| sent_at | timestamp | When successfully sent |
| error_message | text | Error details if failed |
| tracking_id | text | Unique tracking ID (UUID) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

#### `email_event`

Tracks email events (opens, clicks, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| queue_id | text | Reference to email_queue |
| tracking_id | text | Tracking ID from email |
| event_type | enum | sent/opened/clicked/replied/bounced/unsubscribed |
| ip_address | text | Visitor IP address |
| user_agent | text | Browser user agent |
| timestamp | timestamp | Event timestamp |
| metadata | jsonb | Additional event data |

#### `email_template`

Stores reusable email templates.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| user_id | text | Reference to user |
| sub_agency_id | text | Optional sub-agency |
| name | text | Template name |
| subject | text | Email subject |
| body_html | text | HTML body |
| body_text | text | Plain text body |
| variables | jsonb | Template variables |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

#### `email_unsubscribe`

Global unsubscribe list.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| email | text | Unsubscribed email (unique) |
| reason | text | Unsubscribe reason |
| campaign_id | text | Campaign that triggered unsubscribe |
| created_at | timestamp | Unsubscribe timestamp |

### Indexes

Critical indexes for performance:

- `email_queue(status, scheduled_for)` - Queue processing
- `email_queue(tracking_id)` - Tracking lookups
- `email_account(token_expires_at)` - Token refresh job
- `email_event(tracking_id, event_type)` - Event queries
- `email_unsubscribe(email)` - Unsubscribe checks

---

## API Endpoints

### Email Account Management

#### POST /api/email-accounts/connect

Connect a Gmail account via OAuth.

**Request:**
```json
{
  "provider": "gmail",
  "credential": "optional_google_one_tap_jwt",
  "subAgencyId": "optional_sub_agency_id"
}
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "message": "Please complete the authorization to connect your Gmail account"
}
```

**Note**: Google One Tap credentials cannot provide refresh tokens. Users must complete the full OAuth flow by visiting the returned `authUrl`.

#### GET /api/email-accounts/oauth/callback

OAuth callback endpoint (called by Google after user authorization).

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: Base64-encoded state parameter with userId and subAgencyId

**Redirects to**: `/dashboard/email-accounts?success=account_connected&email=...`

#### GET /api/email-accounts

List connected email accounts.

**Query Parameters:**
- `subAgencyId` (optional): Filter by sub-agency

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "id": "account_id",
      "email": "user@gmail.com",
      "provider": "gmail",
      "status": "connected",
      "dailyQuota": 500,
      "quotaUsedToday": 42,
      "quotaResetAt": "2025-12-07T00:00:00Z",
      "createdAt": "2025-12-06T10:00:00Z"
    }
  ]
}
```

#### GET /api/email-accounts/[id]

Get single email account details.

#### DELETE /api/email-accounts/[id]

Disconnect an email account.

**Note**: Prevents deletion if there are pending emails in the queue.

#### POST /api/email-accounts/[id]/refresh

Manually trigger token refresh.

### Campaign Management

#### POST /api/campaigns

Create a new email campaign.

**Request:**
```json
{
  "name": "Q4 Outreach Campaign",
  "subAgencyId": "optional",
  "emailAccountId": "account_id",
  "recipients": [
    {
      "email": "recipient@example.com",
      "name": "John Doe",
      "variables": {
        "firstName": "John",
        "company": "Acme Corp"
      }
    }
  ],
  "subject": "Hi {{firstName}}, let's connect",
  "bodyHtml": "<p>Hello {{firstName}} from {{company}}!</p>",
  "bodyText": "Hello {{firstName}} from {{company}}!",
  "scheduledFor": "2025-12-07T09:00:00Z",
  "priority": 5
}
```

**Response:**
```json
{
  "success": true,
  "campaign": {
    "id": "campaign_id",
    "name": "Q4 Outreach Campaign",
    "status": "scheduled",
    "totalRecipients": 100,
    "createdAt": "2025-12-06T10:00:00Z"
  },
  "queuedEmails": 100
}
```

#### GET /api/campaigns

List campaigns with stats.

**Query Parameters:**
- `subAgencyId` (optional)
- `status` (optional): draft/scheduled/sending/completed/paused
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

#### GET /api/campaigns/[id]

Get campaign details with queue stats.

#### DELETE /api/campaigns/[id]

Delete a campaign and all associated queue entries and events.

### Queue Processing

#### POST /api/email-queue/process

Manually trigger queue processing (requires authentication).

**Request:**
```json
{
  "batchSize": 50
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "processed": 50,
    "sent": 48,
    "failed": 2,
    "skipped": 0
  }
}
```

### Email Tracking

#### GET /api/email-tracking/pixel/[trackingId].png

Tracking pixel endpoint (records email opens).

Returns: 1x1 transparent PNG image

#### GET /api/email-tracking/click/[trackingId]?url=...

Click tracking endpoint (records link clicks and redirects).

**Query Parameters:**
- `url`: Original URL to redirect to

#### GET /api/email-tracking/unsubscribe/[trackingId]

Display unsubscribe confirmation page.

#### POST /api/email-tracking/unsubscribe/[trackingId]

Process unsubscribe request.

### Background Job Endpoints

#### POST /api/cron/refresh-tokens

Refresh expiring OAuth tokens (protected by CRON_SECRET).

**Headers:**
- `Authorization: Bearer YOUR_CRON_SECRET`

#### POST /api/cron/process-queue

Process email queue (protected by CRON_SECRET).

**Headers:**
- `Authorization: Bearer YOUR_CRON_SECRET`

---

## Setup & Configuration

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/api/email-accounts/oauth/callback`
     - Production: `https://yourdomain.com/api/email-accounts/oauth/callback`

5. Configure OAuth Consent Screen:
   - User type: External (for most cases)
   - Add required scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

6. Copy Client ID and Client Secret

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Gmail Encryption Key (32 bytes, base64 encoded)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
GMAIL_ENCRYPTION_KEY=your_32_byte_base64_key_here

# Gmail OAuth Redirect URI
GMAIL_OAUTH_REDIRECT_URI=http://localhost:3000/api/email-accounts/oauth/callback

# Base URL for tracking links
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Cron Secret for background jobs
CRON_SECRET=your_cron_secret_here

# Database URL
DATABASE_URL=postgres://user:password@localhost:5432/coldflow
```

### 3. Database Migration

Run the database migration to create all required tables:

```bash
pnpm db:migrate
```

### 4. Cron Job Setup

Set up cron jobs for background processing:

#### Option A: Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-tokens",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/process-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Option B: External Cron Service

Use a service like cron-job.org or EasyCron:

1. Token Refresh Job:
   - URL: `https://yourdomain.com/api/cron/refresh-tokens`
   - Method: POST
   - Schedule: Every 30 minutes
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

2. Queue Processing Job:
   - URL: `https://yourdomain.com/api/cron/process-queue`
   - Method: POST
   - Schedule: Every 5 minutes
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

---

## OAuth Flow

### Traditional OAuth Flow (Recommended)

The system uses the traditional OAuth 2.0 authorization code flow to obtain refresh tokens:

```
User clicks "Connect Gmail"
    ↓
Frontend calls POST /api/email-accounts/connect
    ↓
Backend generates authorization URL with state
    ↓
User redirected to Google consent screen
    ↓
User grants permissions
    ↓
Google redirects to /api/email-accounts/oauth/callback?code=...&state=...
    ↓
Backend exchanges authorization code for tokens
    ↓
Tokens encrypted and stored in database
    ↓
User redirected to success page
```

### Why Not Google One Tap?

Google One Tap provides ID tokens (JWTs) for user identification, but does NOT provide refresh tokens needed for long-term API access. Therefore:

- One Tap can be used for initial user authentication
- Full OAuth flow is required for Gmail API access
- The `credential` parameter in `/api/email-accounts/connect` is optional and only used for duplicate account checking

---

## Email Sending Process

### 1. Campaign Creation

1. User creates campaign with recipients
2. System validates email account status and ownership
3. Queue entries created for each recipient
4. Template variables replaced in subject/body
5. Unique tracking ID generated for each email

### 2. Queue Processing

The queue processor runs periodically (every 5 minutes via cron):

```
Fetch next batch of pending emails (FOR UPDATE SKIP LOCKED)
    ↓
For each email:
    ↓
Check if recipient unsubscribed → Skip
    ↓
Check if scheduled time passed → Skip if not ready
    ↓
Check email account quota → Reschedule if exceeded
    ↓
Update status to "processing"
    ↓
Refresh token if expired
    ↓
Inject tracking pixel and wrap links
    ↓
Send via Gmail API
    ↓
Update status to "sent" or "failed"
    ↓
Create "sent" event
    ↓
Increment campaign stats
```

### 3. Retry Logic

- Failed emails retry up to `maxAttempts` (default: 3)
- Exponential backoff between retries
- Permanent failures logged with error messages

### 4. Quota Management

- Daily quota per account (500 for standard Gmail, 2000 for Workspace)
- Quota resets at midnight UTC
- Emails automatically rescheduled if quota exceeded

---

## Tracking System

### Open Tracking

Implemented via 1x1 transparent tracking pixel:

```html
<img src="https://yourdomain.com/api/email-tracking/pixel/{trackingId}.png"
     width="1" height="1" style="display:none;" />
```

- Pixel inserted before `</body>` tag or at end of HTML
- First open increments campaign `openCount`
- All opens logged as events with IP and user agent

### Click Tracking

All links in HTML body wrapped with tracking redirects:

```html
Original: <a href="https://example.com">Click here</a>

Wrapped:  <a href="https://yourdomain.com/api/email-tracking/click/{trackingId}?url=https%3A%2F%2Fexample.com">Click here</a>
```

- Clicks logged with destination URL, IP, and user agent
- Redirects to original URL with 302 status
- Each click increments campaign `clickCount`

### Unsubscribe Tracking

Unsubscribe link should be added to email templates:

```html
<a href="https://yourdomain.com/api/email-tracking/unsubscribe/{trackingId}">
  Unsubscribe
</a>
```

Process:
1. User clicks unsubscribe link
2. Confirmation page displayed
3. User confirms unsubscribe
4. Email added to global unsubscribe list
5. All pending emails for that email address cancelled
6. Unsubscribe event logged

---

## Background Jobs

### Token Refresh Job

**Purpose**: Automatically refresh OAuth tokens before they expire

**Schedule**: Every 30 minutes

**Process**:
1. Query accounts with tokens expiring within 5 minutes
2. Decrypt refresh tokens
3. Request new access tokens from Google
4. Encrypt and store new access tokens
5. Update account status on success/failure

**Error Handling**:
- Revoked tokens → Mark account as "disconnected"
- Temporary errors → Mark as "error", retry next run
- All errors logged for debugging

### Queue Processing Job

**Purpose**: Send pending emails from the queue

**Schedule**: Every 5 minutes

**Process**:
1. Fetch next batch of pending emails (default: 50)
2. Check unsubscribe status
3. Verify scheduled time
4. Check account quota
5. Send emails via Gmail API
6. Update queue status and campaign stats

**Concurrency**:
- Uses `FOR UPDATE SKIP LOCKED` to prevent duplicate processing
- Multiple workers can run simultaneously

---

## Security Considerations

### Token Encryption

- **Algorithm**: AES-256-GCM
- **Key**: 32-byte key stored in `GMAIL_ENCRYPTION_KEY` env variable
- **IV**: Random 12-byte IV generated for each encryption
- **Authentication**: GCM provides authentication to prevent tampering

**Key Generation**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### OAuth Security

- State parameter prevents CSRF attacks
- State includes timestamp to prevent replay attacks (10-minute expiry)
- Redirect URI validated by Google
- Minimal scopes requested (gmail.send, gmail.readonly)

### API Security

- All endpoints require authentication (session or API key)
- Ownership verification for email accounts and campaigns
- Rate limiting on sensitive endpoints
- CRON endpoints protected by secret token

### Data Security

- OAuth tokens never returned in API responses
- Encrypted tokens only decrypted when needed for Gmail API calls
- Sensitive operations logged for audit trail

### Tracking Security

- Tracking IDs are UUIDs (unpredictable)
- Click tracking validates URLs and blocks dangerous protocols (file://, javascript:, etc.)
- Tracking endpoints fail gracefully (never break email rendering)

---

## Testing

### Unit Tests

Token encryption test:

```bash
pnpm test src/lib/__tests__/tokenEncryption.test.ts
```

### Manual Testing

1. **Connect Gmail Account**:
   ```bash
   curl -X POST http://localhost:3000/api/email-accounts/connect \
     -H "Cookie: session=..." \
     -H "Content-Type: application/json" \
     -d '{"provider": "gmail"}'
   ```

2. **Create Campaign**:
   ```bash
   curl -X POST http://localhost:3000/api/campaigns \
     -H "Cookie: session=..." \
     -H "Content-Type: application/json" \
     -d @campaign.json
   ```

3. **Process Queue**:
   ```bash
   curl -X POST http://localhost:3000/api/email-queue/process \
     -H "Cookie: session=..." \
     -H "Content-Type: application/json" \
     -d '{"batchSize": 10}'
   ```

---

## Troubleshooting

### Common Issues

#### 1. "No refresh token returned from Google"

**Cause**: Google One Tap was used instead of full OAuth flow

**Solution**: Ensure users complete the full OAuth flow by visiting the authorization URL returned from `/api/email-accounts/connect`

#### 2. "Token refresh failed: invalid_grant"

**Cause**: User revoked access or refresh token expired

**Solution**: User must reconnect their Gmail account

#### 3. "Daily quota exceeded"

**Cause**: Account has sent maximum emails for the day

**Solution**:
- Wait until midnight UTC for quota reset
- Upgrade to Google Workspace for higher quota (2000/day)
- Connect additional email accounts

#### 4. Emails stuck in "processing" status

**Cause**: Queue processor crashed during send

**Solution**:
- Check cron job is running
- Manually trigger queue processing: `POST /api/email-queue/process`
- Check logs for errors

#### 5. Tracking pixel not recording opens

**Cause**: Email client blocking images

**Solution**:
- Open tracking depends on email client loading images
- Gmail and Outlook often cache/proxy images
- Consider alternative metrics like click tracking

### Debug Mode

Enable detailed logging:

```bash
# Set environment variable
DEBUG=email:*
```

### Database Queries

Check queue status:

```sql
SELECT status, COUNT(*)
FROM email_queue
GROUP BY status;
```

Check campaign stats:

```sql
SELECT
  c.name,
  c.total_recipients,
  c.sent_count,
  c.open_count,
  c.click_count
FROM email_campaign c
ORDER BY c.created_at DESC
LIMIT 10;
```

---

## Performance Optimization

### Database

- Ensure all indexes are created
- Use connection pooling
- Consider partitioning `email_event` table by timestamp for large volumes

### Queue Processing

- Adjust batch size based on sending volume
- Run multiple queue processors for high throughput
- Monitor queue depth and adjust cron frequency

### Caching

- Cache frequently accessed email accounts
- Cache unsubscribe list in memory for fast lookups

---

## Future Enhancements

Potential improvements not currently implemented:

1. **Email Warmup**: Gradually increase sending volume for new accounts
2. **A/B Testing**: Test multiple subject lines and content variations
3. **Advanced Personalization**: Liquid templates, conditional content
4. **Deliverability Monitoring**: SPF, DKIM, DMARC checks
5. **Bounce Handling**: Parse bounce messages from Gmail inbox
6. **Reply Detection**: Monitor inbox for replies and update campaign stats
7. **Email Validation**: Integrate with NeverBounce or ZeroBounce
8. **Custom Domains**: Use custom domains for tracking links
9. **Real-time Dashboard**: WebSocket updates for campaign progress
10. **Follow-up Sequences**: Automated multi-email sequences

---

## Support

For issues or questions:

1. Check this documentation
2. Review error logs
3. Check GitHub issues
4. Contact development team

---

## License

This email system is part of the Coldflow CRM and follows the project's license.
