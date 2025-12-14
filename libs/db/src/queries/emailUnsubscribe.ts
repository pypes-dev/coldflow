import { eq } from 'drizzle-orm';
import { db } from '../client';
import {
  emailUnsubscribe,
  EmailUnsubscribe,
  InsertEmailUnsubscribe,
} from '../schema';

/**
 * Add an email to the unsubscribe list
 */
export const addEmailToUnsubscribeList = async (
  data: InsertEmailUnsubscribe
): Promise<EmailUnsubscribe> => {
  // Use ON CONFLICT DO NOTHING to handle duplicates gracefully
  const results = await db
    .insert(emailUnsubscribe)
    .values(data)
    .onConflictDoNothing()
    .returning();

  // If insert was skipped due to conflict, fetch the existing record
  if (results.length === 0) {
    const existing = await isEmailUnsubscribed(data.email);
    if (existing) {
      return existing;
    }
  }

  return results[0];
};

/**
 * Check if an email is on the unsubscribe list
 */
export const isEmailUnsubscribed = async (email: string): Promise<EmailUnsubscribe | null> => {
  const results = await db
    .select()
    .from(emailUnsubscribe)
    .where(eq(emailUnsubscribe.email, email.toLowerCase()))
    .limit(1);

  return results[0] || null;
};

/**
 * Remove an email from the unsubscribe list (re-subscribe)
 */
export const removeEmailFromUnsubscribeList = async (email: string): Promise<boolean> => {
  const results = await db
    .delete(emailUnsubscribe)
    .where(eq(emailUnsubscribe.email, email.toLowerCase()))
    .returning();

  return results.length > 0;
};

/**
 * Get all unsubscribed emails (for admin purposes)
 */
export const getAllUnsubscribedEmails = async (): Promise<EmailUnsubscribe[]> => {
  return await db
    .select()
    .from(emailUnsubscribe)
    .orderBy(emailUnsubscribe.createdAt);
};
