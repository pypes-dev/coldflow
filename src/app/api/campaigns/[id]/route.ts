import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthorizationError } from '@/lib/authorization';
import {
  getCampaignWithStats,
  deleteCampaign,
} from '@coldflow/db';

/**
 * GET /api/campaigns/[id]
 *
 * Get detailed information about a specific campaign.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const user = await requireAuth();

    // Fetch campaign with stats
    const campaign = await getCampaignWithStats(id);

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to access this campaign' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        openCount: campaign.openCount,
        clickCount: campaign.clickCount,
        replyCount: campaign.replyCount,
        bounceCount: campaign.bounceCount,
        unsubscribeCount: campaign.unsubscribeCount,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        queueStats: campaign.queueStats,
      },
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/[id]
 *
 * Delete a campaign (and all associated queue entries and events).
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const user = await requireAuth();

    // Delete campaign (verify ownership)
    const deleted = await deleteCampaign(id, user.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
