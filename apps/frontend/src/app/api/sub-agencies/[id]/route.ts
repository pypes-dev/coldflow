import { NextRequest, NextResponse } from 'next/server'
import {
  getSubAgencyById,
  updateSubAgency,
  deleteSubAgency,
  isSubAgencyOwner,
} from '@coldflow/db'
import { requireAuth } from '@/lib/authorization'
import { z } from 'zod'

const updateSubAgencySchema = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().optional(),
})

// GET /api/sub-agencies/[id] - Get single sub-agency details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const agency = await getSubAgencyById(id)

    if (!agency) {
      return NextResponse.json(
        { error: 'Sub-agency not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this agency
    const hasAccess =
      agency.ownerId === user.id ||
      agency.agencyUsers.some((au: any) => au.userId === user.id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this sub-agency' },
        { status: 403 }
      )
    }

    return NextResponse.json(agency)
  } catch (error: any) {
    if (error.statusCode === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching sub-agency:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sub-agency' },
      { status: 500 }
    )
  }
}

// PATCH /api/sub-agencies/[id] - Update sub-agency
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Check if user is owner
    const isOwner = await isSubAgencyOwner(user.id, id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only agency owner can update sub-agency' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateSubAgencySchema.parse(body)

    const updated = await updateSubAgency(id, validatedData)

    return NextResponse.json(updated)
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
    console.error('Error updating sub-agency:', error)
    return NextResponse.json(
      { error: 'Failed to update sub-agency' },
      { status: 500 }
    )
  }
}

// DELETE /api/sub-agencies/[id] - Delete sub-agency
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Check if user is owner
    const isOwner = await isSubAgencyOwner(user.id, id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only agency owner can delete sub-agency' },
        { status: 403 }
      )
    }

    // Delete will cascade to agency_user records automatically
    await deleteSubAgency(id)

    return NextResponse.json({ message: 'Sub-agency deleted successfully' })
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    console.error('Error deleting sub-agency:', error)
    return NextResponse.json(
      { error: 'Failed to delete sub-agency' },
      { status: 500 }
    )
  }
}
