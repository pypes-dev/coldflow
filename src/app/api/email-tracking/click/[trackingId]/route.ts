import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import {
  getQueueEntryByTrackingId,
  createEmailEvent,
  incrementCampaignStat,
} from '@coldflow/db';

/**
 * GET /api/email-tracking/click/[trackingId]?url=...
 *
 * Click tracking endpoint - records link clicks and redirects to original URL.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);

      // Security: Block file:// and other dangerous protocols
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (_error) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL' },
        { status: 400 }
      );
    }

    // Get queue entry by tracking ID
    const queueEntry = await getQueueEntryByTrackingId(trackingId);

    if (queueEntry) {
      // Get request metadata
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                       request.headers.get('x-real-ip') ||
                       'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Create email event
      await createEmailEvent({
        id: nanoid(),
        queueId: queueEntry.id,
        trackingId,
        eventType: 'clicked',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        metadata: {
          url: url,
        },
      });

      // Increment campaign click count
      await incrementCampaignStat(queueEntry.campaignId, 'clickCount');

      console.log(`Link clicked: ${trackingId} -> ${url}`);
    }

    // Redirect to the original URL
    return NextResponse.redirect(targetUrl.toString(), 302);
  } catch (error) {
    console.error('Error tracking click:', error);

    // Try to redirect anyway, or return error
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (url) {
      try {
        const targetUrl = new URL(url);
        if (['http:', 'https:'].includes(targetUrl.protocol)) {
          return NextResponse.redirect(targetUrl.toString(), 302);
        }
      } catch (_e) {
        // Fall through to error response
      }
    }

    return NextResponse.json(
      { success: false, error: 'Click tracking failed' },
      { status: 500 }
    );
  }
}
