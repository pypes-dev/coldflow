import { NextRequest, NextResponse } from 'next/server'
import {
  getAgencyUsersByOwner,
  getAgencyUserByUserAndAgency,
  createAgencyUser,
  getAgencyUserByIdWithDetails,
  isAgencyAdmin,
  isSubAgencyOwner,
  getUserByEmail,
} from '@coldflow/db'
import { requireAuth } from '@/lib/authorization'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const assignUserSchema = z.object({
  userId: z.string(),
  subAgencyId: z.string(),
  role: z.enum(['admin', 'member', 'viewer']),
})

// GET /api/agency-users - List all users assigned to sub-agencies
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const subAgencyId = searchParams.get('subAgencyId')

    // Verify user has access to this sub-agency if filtered
    if (subAgencyId) {
      const isOwner = await isSubAgencyOwner(currentUser.id, subAgencyId)
      if (!isOwner) {
        const isAdmin = await isAgencyAdmin(currentUser.id, subAgencyId)
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Access denied to this sub-agency' },
            { status: 403 }
          )
        }
      }
    }

    const assignments = await getAgencyUsersByOwner(
      currentUser.id,
      subAgencyId || undefined
    )

    return NextResponse.json({ data: assignments })
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    console.error('Error fetching agency users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agency users' },
      { status: 500 }
    )
  }
}

// POST /api/agency-users - Assign user to sub-agency
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const body = await request.json()
    const validatedData = assignUserSchema.parse(body)

    // Check if current user is owner or admin of the sub-agency
    const isOwner = await isSubAgencyOwner(
      currentUser.id,
      validatedData.subAgencyId
    )
    if (!isOwner) {
      const isAdmin = await isAgencyAdmin(
        currentUser.id,
        validatedData.subAgencyId
      )
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only agency owner or admin can assign users' },
          { status: 403 }
        )
      }
    }

    // Check if user exists
    const targetUser = await getUserByEmail('')
    // Note: In production, you would have a proper user lookup

    // Check if assignment already exists
    const existing = await getAgencyUserByUserAndAgency(
      validatedData.userId,
      validatedData.subAgencyId
    )

    if (existing) {
      return NextResponse.json(
        { error: 'User is already assigned to this sub-agency' },
        { status: 400 }
      )
    }

    // Create assignment
    const assignmentId = nanoid()
    await createAgencyUser({
      id: assignmentId,
      userId: validatedData.userId,
      subAgencyId: validatedData.subAgencyId,
      role: validatedData.role,
    })

    // Fetch complete assignment with user and agency details
    const complete = await getAgencyUserByIdWithDetails(assignmentId)

    return NextResponse.json(complete, { status: 201 })
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      )
    }
    console.error('Error assigning user:', error)
    return NextResponse.json(
      { error: 'Failed to assign user to sub-agency' },
      { status: 500 }
    )
  }
}
