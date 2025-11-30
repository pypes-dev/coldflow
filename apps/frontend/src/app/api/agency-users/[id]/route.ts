import { NextRequest, NextResponse } from 'next/server'
import {
  getAgencyUserById,
  updateAgencyUserRole,
  deleteAgencyUser,
  getAgencyUserByIdWithDetails,
  isAgencyAdmin,
  isSubAgencyOwner,
} from '@coldflow/db'
import { requireAuth } from '@/lib/authorization'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
})

// PATCH /api/agency-users/[id] - Update user's role in sub-agency
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = await params

    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)

    // Get existing assignment
    const assignment = await getAgencyUserById(id)

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if current user is owner or admin of the sub-agency
    const isOwner = await isSubAgencyOwner(currentUser.id, assignment.subAgencyId)
    if (!isOwner) {
      const isAdmin = await isAgencyAdmin(
        currentUser.id,
        assignment.subAgencyId
      )
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only agency owner or admin can update user roles' },
          { status: 403 }
        )
      }
    }

    // Update role
    await updateAgencyUserRole(id, validatedData.role)

    // Fetch complete assignment with user and agency details
    const complete = await getAgencyUserByIdWithDetails(id)

    return NextResponse.json(complete)
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}

// DELETE /api/agency-users/[id] - Remove user from sub-agency
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = await params

    // Get existing assignment
    const assignment = await getAgencyUserById(id)

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if current user is owner or admin of the sub-agency
    const isOwner = await isSubAgencyOwner(currentUser.id, assignment.subAgencyId)
    if (!isOwner) {
      const isAdmin = await isAgencyAdmin(
        currentUser.id,
        assignment.subAgencyId
      )
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only agency owner or admin can remove users' },
          { status: 403 }
        )
      }
    }

    // Delete assignment
    await deleteAgencyUser(id)

    return NextResponse.json({
      message: 'User removed from sub-agency successfully',
    })
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    console.error('Error removing user from sub-agency:', error)
    return NextResponse.json(
      { error: 'Failed to remove user from sub-agency' },
      { status: 500 }
    )
  }
}
