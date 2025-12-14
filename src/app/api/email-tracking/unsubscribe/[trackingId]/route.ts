import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import {
  getQueueEntryByTrackingId,
  createEmailEvent,
  incrementCampaignStat,
  addEmailToUnsubscribeList,
  cancelPendingEmailsForRecipient,
} from '@coldflow/db';

/**
 * GET /api/email-tracking/unsubscribe/[trackingId]
 *
 * Display unsubscribe confirmation page.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;

    // Get queue entry to retrieve recipient email
    const queueEntry = await getQueueEntryByTrackingId(trackingId);

    if (!queueEntry) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Unsubscribe</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>Unsubscribe</h1>
          <p class="error">Invalid unsubscribe link. The tracking ID was not found.</p>
        </body>
        </html>
        `,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Render unsubscribe confirmation form
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribe</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        .email { font-weight: bold; color: #333; }
        .button {
          display: inline-block;
          background-color: #e74c3c;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          border: none;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
        }
        .button:hover { background-color: #c0392b; }
        .success { color: #27ae60; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Unsubscribe from Emails</h1>
        <p>You are about to unsubscribe the email address:</p>
        <p class="email">${queueEntry.recipientEmail}</p>
        <p>If you unsubscribe, you will no longer receive emails from our campaigns.</p>
        <form method="POST" action="/api/email-tracking/unsubscribe/${trackingId}">
          <input type="hidden" name="reason" value="user_request">
          <button type="submit" class="button">Confirm Unsubscribe</button>
        </form>
      </div>
    </body>
    </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error displaying unsubscribe page:', error);

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .error { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>Error</h1>
        <p class="error">An error occurred. Please try again later.</p>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

/**
 * POST /api/email-tracking/unsubscribe/[trackingId]
 *
 * Process unsubscribe request.
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;

    // Get queue entry to retrieve recipient email and campaign
    const queueEntry = await getQueueEntryByTrackingId(trackingId);

    if (!queueEntry) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>Error</h1>
          <p class="error">Invalid unsubscribe link.</p>
        </body>
        </html>
        `,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Add email to global unsubscribe list
    await addEmailToUnsubscribeList({
      id: nanoid(),
      email: queueEntry.recipientEmail.toLowerCase(),
      reason: 'user_request',
      campaignId: queueEntry.campaignId,
    });

    // Cancel all pending emails for this recipient
    const cancelledCount = await cancelPendingEmailsForRecipient(queueEntry.recipientEmail);

    // Create unsubscribe event
    await createEmailEvent({
      id: nanoid(),
      queueId: queueEntry.id,
      trackingId,
      eventType: 'unsubscribed',
      ipAddress,
      userAgent,
      timestamp: new Date(),
      metadata: {
        cancelledEmails: cancelledCount,
      },
    });

    // Increment campaign unsubscribe count
    await incrementCampaignStat(queueEntry.campaignId, 'unsubscribeCount');

    console.log(`Unsubscribed: ${queueEntry.recipientEmail} (cancelled ${cancelledCount} pending emails)`);

    // Render success page
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribed</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #27ae60; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        .email { font-weight: bold; color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Successfully Unsubscribed</h1>
        <p>The email address <span class="email">${queueEntry.recipientEmail}</span> has been removed from our mailing list.</p>
        <p>You will no longer receive emails from our campaigns.</p>
        ${cancelledCount > 0 ? `<p>${cancelledCount} pending email(s) have been cancelled.</p>` : ''}
        <p>If you unsubscribed by mistake, please contact us to resubscribe.</p>
      </div>
    </body>
    </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error processing unsubscribe:', error);

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .error { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>Error</h1>
        <p class="error">An error occurred processing your unsubscribe request. Please try again later.</p>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
