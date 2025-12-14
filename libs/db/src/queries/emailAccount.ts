import { eq, and, lt, sql } from 'drizzle-orm';
import { db } from '../client';
import {
  emailAccount,
  EmailAccount,
  InsertEmailAccount,
} from '../schema';

/**
 * Get all email accounts for a user, optionally filtered by subAgency
 */
export const getEmailAccountsByUserId = async (
  userId: string,
  subAgencyId?: string | null
) => {
  const conditions = [eq(emailAccount.userId, userId)];

  if (subAgencyId) {
    conditions.push(eq(emailAccount.subAgencyId, subAgencyId));
  }

  return await db
    .select({
      id: emailAccount.id,
      userId: emailAccount.userId,
      subAgencyId: emailAccount.subAgencyId,
      email: emailAccount.email,
      provider: emailAccount.provider,
      status: emailAccount.status,
      dailyQuota: emailAccount.dailyQuota,
      quotaUsedToday: emailAccount.quotaUsedToday,
      quotaResetAt: emailAccount.quotaResetAt,
      lastSyncedAt: emailAccount.lastSyncedAt,
      errorMessage: emailAccount.errorMessage,
      createdAt: emailAccount.createdAt,
      updatedAt: emailAccount.updatedAt,
      // Explicitly exclude encrypted tokens from results
    })
    .from(emailAccount)
    .where(and(...conditions));
};

/**
 * Get a single email account by ID (includes encrypted tokens - use carefully!)
 */
export const getEmailAccountById = async (id: string): Promise<EmailAccount | null> => {
  const results = await db
    .select()
    .from(emailAccount)
    .where(eq(emailAccount.id, id))
    .limit(1);

  return results[0] || null;
};

/**
 * Create a new email account
 */
export const createEmailAccount = async (data: InsertEmailAccount): Promise<EmailAccount> => {
  const results = await db
    .insert(emailAccount)
    .values(data)
    .returning();

  return results[0];
};

/**
 * Update OAuth tokens for an email account
 */
export const updateEmailAccountTokens = async (
  id: string,
  encryptedAccessToken: string,
  encryptedRefreshToken: string,
  expiresAt: Date
): Promise<EmailAccount | null> => {
  const results = await db
    .update(emailAccount)
    .set({
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(emailAccount.id, id))
    .returning();

  return results[0] || null;
};

/**
 * Update email account status
 */
export const updateEmailAccountStatus = async (
  id: string,
  status: 'connected' | 'disconnected' | 'error',
  errorMessage?: string | null
): Promise<EmailAccount | null> => {
  const results = await db
    .update(emailAccount)
    .set({
      status,
      errorMessage: errorMessage || null,
      updatedAt: new Date(),
    })
    .where(eq(emailAccount.id, id))
    .returning();

  return results[0] || null;
};

/**
 * Update email account quota usage
 */
export const updateEmailAccountQuota = async (
  id: string,
  quotaUsed: number,
  resetAt: Date
): Promise<EmailAccount | null> => {
  const results = await db
    .update(emailAccount)
    .set({
      quotaUsedToday: quotaUsed,
      quotaResetAt: resetAt,
      updatedAt: new Date(),
    })
    .where(eq(emailAccount.id, id))
    .returning();

  return results[0] || null;
};

/**
 * Increment quota usage for an email account
 */
export const incrementEmailAccountQuota = async (id: string): Promise<EmailAccount | null> => {
  const results = await db
    .update(emailAccount)
    .set({
      quotaUsedToday: sql`${emailAccount.quotaUsedToday} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(emailAccount.id, id))
    .returning();

  return results[0] || null;
};

/**
 * Delete an email account (with ownership verification)
 */
export const deleteEmailAccount = async (id: string, userId: string): Promise<boolean> => {
  const results = await db
    .delete(emailAccount)
    .where(and(eq(emailAccount.id, id), eq(emailAccount.userId, userId)))
    .returning();

  return results.length > 0;
};

/**
 * Get accounts that need token refresh (expiring within 5 minutes)
 */
export const getAccountsNeedingTokenRefresh = async (): Promise<EmailAccount[]> => {
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  return await db
    .select()
    .from(emailAccount)
    .where(
      and(
        eq(emailAccount.status, 'connected'),
        lt(emailAccount.tokenExpiresAt, fiveMinutesFromNow)
      )
    );
};

/**
 * Check if an email account already exists for a user
 */
export const emailAccountExists = async (
  userId: string,
  email: string
): Promise<boolean> => {
  const results = await db
    .select({ id: emailAccount.id })
    .from(emailAccount)
    .where(and(eq(emailAccount.userId, userId), eq(emailAccount.email, email)))
    .limit(1);

  return results.length > 0;
};
