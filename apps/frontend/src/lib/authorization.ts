import { headers } from 'next/headers'
import { auth } from '@coldflow/auth'
import {
  checkUserRole,
  isAgencyAdmin as dbIsAgencyAdmin,
  getUserRole as dbGetUserRole,
  isSubAgencyOwner,
} from '@coldflow/db'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
}

export class AuthorizationError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 403) {
    super(message)
    this.name = 'AuthorizationError'
    this.statusCode = statusCode
  }
}

/**
 * Verify user session and return authenticated user
 * Throws 401 if not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    throw new AuthorizationError('Unauthorized - Please sign in', 401)
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  }
}

/**
 * Check if user has minimum required role in a sub-agency
 * Role hierarchy: admin > member > viewer
 */
export async function requireRole(
  userId: string,
  subAgencyId: string,
  requiredRole: 'admin' | 'member' | 'viewer'
): Promise<boolean> {
  const result = await checkUserRole(userId, subAgencyId, requiredRole)

  if (!result.userRole) {
    throw new AuthorizationError('User is not a member of this agency', 403)
  }

  if (!result.hasPermission) {
    throw new AuthorizationError(
      `Insufficient permissions. Required: ${requiredRole}, Current: ${result.userRole}`,
      403
    )
  }

  return true
}

/**
 * Check if user is admin of a sub-agency
 */
export async function isAgencyAdmin(
  userId: string,
  subAgencyId: string
): Promise<boolean> {
  return dbIsAgencyAdmin(userId, subAgencyId)
}

/**
 * Check if user owns a sub-agency
 */
export async function isAgencyOwner(
  userId: string,
  subAgencyId: string
): Promise<boolean> {
  return isSubAgencyOwner(userId, subAgencyId)
}

/**
 * Get user's role in a sub-agency
 */
export async function getUserRole(
  userId: string,
  subAgencyId: string
): Promise<'admin' | 'member' | 'viewer' | null> {
  return dbGetUserRole(userId, subAgencyId)
}
