import { eq, and, desc } from 'drizzle-orm';
import { db } from '../client';
import {
  emailTemplate,
  EmailTemplate,
  InsertEmailTemplate,
} from '../schema';

/**
 * Create a new email template
 */
export const createEmailTemplate = async (data: InsertEmailTemplate): Promise<EmailTemplate> => {
  const results = await db
    .insert(emailTemplate)
    .values(data)
    .returning();

  return results[0];
};

/**
 * Get template by ID
 */
export const getEmailTemplateById = async (id: string): Promise<EmailTemplate | null> => {
  const results = await db
    .select()
    .from(emailTemplate)
    .where(eq(emailTemplate.id, id))
    .limit(1);

  return results[0] || null;
};

/**
 * Get templates by user ID
 */
export const getEmailTemplatesByUserId = async (
  userId: string,
  subAgencyId?: string | null
): Promise<EmailTemplate[]> => {
  const conditions = [eq(emailTemplate.userId, userId)];

  if (subAgencyId) {
    conditions.push(eq(emailTemplate.subAgencyId, subAgencyId));
  }

  return await db
    .select()
    .from(emailTemplate)
    .where(and(...conditions))
    .orderBy(desc(emailTemplate.createdAt));
};

/**
 * Update an email template
 */
export const updateEmailTemplate = async (
  id: string,
  data: Partial<InsertEmailTemplate>
): Promise<EmailTemplate | null> => {
  const results = await db
    .update(emailTemplate)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(emailTemplate.id, id))
    .returning();

  return results[0] || null;
};

/**
 * Delete an email template
 */
export const deleteEmailTemplate = async (id: string, userId: string): Promise<boolean> => {
  const results = await db
    .delete(emailTemplate)
    .where(and(eq(emailTemplate.id, id), eq(emailTemplate.userId, userId)))
    .returning();

  return results.length > 0;
};
