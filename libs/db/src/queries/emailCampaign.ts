import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../client';
import {
  emailCampaign,
  EmailCampaign,
  InsertEmailCampaign,
  emailQueue,
  emailEvent,
} from '../schema';

/**
 * Create a new campaign
 */
export const createCampaign = async (data: InsertEmailCampaign): Promise<EmailCampaign> => {
  const results = await db
    .insert(emailCampaign)
    .values(data)
    .returning();

  return results[0];
};

/**
 * Get campaign by ID
 */
export const getCampaignById = async (id: string): Promise<EmailCampaign | null> => {
  const results = await db
    .select()
    .from(emailCampaign)
    .where(eq(emailCampaign.id, id))
    .limit(1);

  return results[0] || null;
};

/**
 * Get campaigns by user ID with optional filters
 */
export const getCampaignsByUserId = async (
  userId: string,
  options?: {
    subAgencyId?: string | null;
    status?: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
    limit?: number;
    offset?: number;
  }
): Promise<EmailCampaign[]> => {
  const conditions = [eq(emailCampaign.userId, userId)];

  if (options?.subAgencyId) {
    conditions.push(eq(emailCampaign.subAgencyId, options.subAgencyId));
  }

  if (options?.status) {
    conditions.push(eq(emailCampaign.status, options.status));
  }

  let query = db
    .select()
    .from(emailCampaign)
    .where(and(...conditions))
    .orderBy(desc(emailCampaign.createdAt));

  if (options?.limit) {
    query = query.limit(options.limit) as any;
  }

  if (options?.offset) {
    query = query.offset(options.offset) as any;
  }

  return await query;
};

/**
 * Update campaign status
 */
export const updateCampaignStatus = async (
  id: string,
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused'
): Promise<EmailCampaign | null> => {
  const results = await db
    .update(emailCampaign)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(emailCampaign.id, id))
    .returning();

  return results[0] || null;
};

/**
 * Update campaign statistics by recalculating from events
 */
export const updateCampaignStats = async (campaignId: string): Promise<EmailCampaign | null> => {
  // Get all queue IDs for this campaign
  const queueEntries = await db
    .select({ id: emailQueue.id })
    .from(emailQueue)
    .where(eq(emailQueue.campaignId, campaignId));

  const queueIds = queueEntries.map(e => e.id);

  if (queueIds.length === 0) {
    return await getCampaignById(campaignId);
  }

  // Get queue stats
  const queueStats = await db
    .select({
      sent: sql<number>`count(*) filter (where ${emailQueue.status} = 'sent')::int`,
      bounced: sql<number>`count(*) filter (where ${emailQueue.status} = 'bounced')::int`,
    })
    .from(emailQueue)
    .where(eq(emailQueue.campaignId, campaignId));

  // Get event stats
  const eventStats = await db
    .select({
      opened: sql<number>`count(distinct ${emailEvent.queueId}) filter (where ${emailEvent.eventType} = 'opened')::int`,
      clicked: sql<number>`count(distinct ${emailEvent.queueId}) filter (where ${emailEvent.eventType} = 'clicked')::int`,
      replied: sql<number>`count(distinct ${emailEvent.queueId}) filter (where ${emailEvent.eventType} = 'replied')::int`,
      unsubscribed: sql<number>`count(distinct ${emailEvent.queueId}) filter (where ${emailEvent.eventType} = 'unsubscribed')::int`,
    })
    .from(emailEvent)
    .where(inArray(emailEvent.queueId, queueIds));

  const stats = {
    sentCount: queueStats[0]?.sent || 0,
    bounceCount: queueStats[0]?.bounced || 0,
    openCount: eventStats[0]?.opened || 0,
    clickCount: eventStats[0]?.clicked || 0,
    replyCount: eventStats[0]?.replied || 0,
    unsubscribeCount: eventStats[0]?.unsubscribed || 0,
  };

  const results = await db
    .update(emailCampaign)
    .set({
      ...stats,
      updatedAt: new Date(),
    })
    .where(eq(emailCampaign.id, campaignId))
    .returning();

  return results[0] || null;
};

/**
 * Increment a specific campaign stat counter
 */
export const incrementCampaignStat = async (
  campaignId: string,
  stat: 'sentCount' | 'openCount' | 'clickCount' | 'replyCount' | 'bounceCount' | 'unsubscribeCount'
): Promise<EmailCampaign | null> => {
  const results = await db
    .update(emailCampaign)
    .set({
      [stat]: sql`${emailCampaign[stat]} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(emailCampaign.id, campaignId))
    .returning();

  return results[0] || null;
};

/**
 * Delete a campaign
 */
export const deleteCampaign = async (id: string, userId: string): Promise<boolean> => {
  const results = await db
    .delete(emailCampaign)
    .where(and(eq(emailCampaign.id, id), eq(emailCampaign.userId, userId)))
    .returning();

  return results.length > 0;
};

/**
 * Get campaign with full details including queue and event stats
 */
export const getCampaignWithStats = async (id: string) => {
  const campaign = await getCampaignById(id);

  if (!campaign) return null;

  const queueStats = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${emailQueue.status} = 'pending')::int`,
      processing: sql<number>`count(*) filter (where ${emailQueue.status} = 'processing')::int`,
      sent: sql<number>`count(*) filter (where ${emailQueue.status} = 'sent')::int`,
      failed: sql<number>`count(*) filter (where ${emailQueue.status} = 'failed')::int`,
      bounced: sql<number>`count(*) filter (where ${emailQueue.status} = 'bounced')::int`,
    })
    .from(emailQueue)
    .where(eq(emailQueue.campaignId, id));

  return {
    ...campaign,
    queueStats: queueStats[0],
  };
};
