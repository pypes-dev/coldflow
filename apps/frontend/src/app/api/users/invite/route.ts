import { NextRequest, NextResponse } from 'next/server'
import {
  getUserByEmail,
  createInvitation,
  getPendingInvitations,
  getSubAgencyById,
  isAgencyAdmin,
  isSubAgencyOwner,
} from '@coldflow/db'
import { requireAuth } from '@/lib/authorization'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
  subAgencyId: z.string(),
})

// POST /api/users/invite - Send email invitation to new user
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const body = await request.json()
    const validatedData = inviteUserSchema.parse(body)

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
          { error: 'Only agency owner or admin can invite users' },
          { status: 403 }
        )
      }
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(validatedData.email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Get sub-agency details for email
    const agency = await getSubAgencyById(validatedData.subAgencyId)

    if (!agency) {
      return NextResponse.json(
        { error: 'Sub-agency not found' },
        { status: 404 }
      )
    }

    // Create invitation token (valid for 7 days)
    const token = nanoid(32)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Store invitation in verification table
    await createInvitation({
      id: nanoid(),
      email: validatedData.email,
      token,
      expiresAt,
    })

    // TODO: Send email with invitation link
    // For now, we'll return the invitation details
    const invitationLink = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/accept-invite?token=${token}`

    // In production, you would send an email here using your email service
    console.log('Invitation link:', invitationLink)

    return NextResponse.json(
      {
        message: 'Invitation sent successfully',
        email: validatedData.email,
        role: validatedData.role,
        subAgencyName: agency.name,
        // Remove this in production - only for development
        invitationLink,
      },
      { status: 201 }
    )
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
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

// GET /api/users/invite - Get pending invitations
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const subAgencyId = searchParams.get('subAgencyId')

    // Verify access if filtering by sub-agency
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

    const invitations = await getPendingInvitations()

    // Transform invitations for response
    const formattedInvitations = invitations.map((inv) => {
      const email = inv.identifier.replace('invite:', '')
      const now = new Date()
      const isExpired = inv.expiresAt < now

      return {
        id: inv.id,
        email,
        status: isExpired ? 'expired' : 'pending',
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
      }
    })

    return NextResponse.json({ data: formattedInvitations })
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}
