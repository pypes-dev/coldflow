import { db } from "../client";
import { agencyUser, user, subAgency } from "../schema";
import { eq, and } from "drizzle-orm";

export interface CreateAgencyUserData {
  id: string;
  userId: string;
  subAgencyId: string;
  role: "admin" | "member" | "viewer";
}

export const getAgencyUsersByOwner = async (ownerId: string, subAgencyId?: string) => {
  let query = db
    .select({
      id: agencyUser.id,
      userId: agencyUser.userId,
      subAgencyId: agencyUser.subAgencyId,
      role: agencyUser.role,
      createdAt: agencyUser.createdAt,
      updatedAt: agencyUser.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      subAgency: {
        id: subAgency.id,
        name: subAgency.name,
      },
    })
    .from(agencyUser)
    .innerJoin(user, eq(agencyUser.userId, user.id))
    .innerJoin(subAgency, eq(agencyUser.subAgencyId, subAgency.id));

  if (subAgencyId) {
    query = query.where(eq(agencyUser.subAgencyId, subAgencyId)) as any;
  } else {
    query = query.where(eq(subAgency.ownerId, ownerId)) as any;
  }

  return query;
};

export const getAgencyUserById = async (id: string) => {
  return db.query.agencyUser.findFirst({
    where: eq(agencyUser.id, id),
  });
};

export const getAgencyUserByIdWithDetails = async (id: string) => {
  return db.query.agencyUser.findFirst({
    where: eq(agencyUser.id, id),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      subAgency: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const getAgencyUserByUserAndAgency = async (
  userId: string,
  subAgencyId: string
) => {
  return db.query.agencyUser.findFirst({
    where: and(
      eq(agencyUser.userId, userId),
      eq(agencyUser.subAgencyId, subAgencyId)
    ),
  });
};

export const createAgencyUser = async (data: CreateAgencyUserData) => {
  const result = await db.insert(agencyUser).values(data).returning();
  return result[0];
};

export const updateAgencyUserRole = async (
  id: string,
  role: "admin" | "member" | "viewer"
) => {
  const result = await db
    .update(agencyUser)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(agencyUser.id, id))
    .returning();

  return result[0];
};

export const deleteAgencyUser = async (id: string) => {
  await db.delete(agencyUser).where(eq(agencyUser.id, id));
};

export const isAgencyAdmin = async (userId: string, subAgencyId: string) => {
  const assignment = await db.query.agencyUser.findFirst({
    where: and(
      eq(agencyUser.userId, userId),
      eq(agencyUser.subAgencyId, subAgencyId)
    ),
  });

  return assignment?.role === "admin";
};

export const getUserRole = async (userId: string, subAgencyId: string) => {
  const assignment = await db.query.agencyUser.findFirst({
    where: and(
      eq(agencyUser.userId, userId),
      eq(agencyUser.subAgencyId, subAgencyId)
    ),
  });

  return assignment?.role || null;
};

export interface RoleCheckResult {
  hasPermission: boolean;
  userRole: "admin" | "member" | "viewer" | null;
  requiredRole: "admin" | "member" | "viewer";
}

/**
 * Check if user has minimum required role in a sub-agency
 * Role hierarchy: admin > member > viewer
 */
export const checkUserRole = async (
  userId: string,
  subAgencyId: string,
  requiredRole: "admin" | "member" | "viewer"
): Promise<RoleCheckResult> => {
  const assignment = await db.query.agencyUser.findFirst({
    where: and(
      eq(agencyUser.userId, userId),
      eq(agencyUser.subAgencyId, subAgencyId)
    ),
  });

  const roleHierarchy = { admin: 3, member: 2, viewer: 1 };
  const userRole = assignment?.role || null;
  const userRoleLevel = userRole ? roleHierarchy[userRole] : 0;
  const requiredRoleLevel = roleHierarchy[requiredRole];

  return {
    hasPermission: userRoleLevel >= requiredRoleLevel,
    userRole,
    requiredRole,
  };
};
