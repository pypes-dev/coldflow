import { NextRequest, NextResponse } from 'next/server'
import {
  getSubAgenciesByOwner,
  createSubAgency,
  createAgencyUser,
} from '@coldflow/db'
import { requireAuth } from '@/lib/authorization'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const createSubAgencySchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().optional(),
  parentAgencyId: z.string().optional(),
})

// GET /api/sub-agencies - List all sub-agencies for authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await getSubAgenciesByOwner(user.id, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.statusCode === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching sub-agencies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sub-agencies' },
      { status: 500 }
    )
  }
}

// POST /api/sub-agencies - Create new sub-agency
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const validatedData = createSubAgencySchema.parse(body)

    const agencyId = nanoid()

    // Create sub-agency
    const newAgency = await createSubAgency({
      id: agencyId,
      name: validatedData.name,
      description: validatedData.description || null,
      parentAgencyId: validatedData.parentAgencyId || null,
      ownerId: user.id,
    })

    // Automatically assign owner as admin
    await createAgencyUser({
      id: nanoid(),
      userId: user.id,
      subAgencyId: agencyId,
      role: 'admin',
    })

    return NextResponse.json(newAgency, { status: 201 })
  } catch (error: any) {
    if (error.statusCode === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      )
    }
    console.error('Error creating sub-agency:', error)
    return NextResponse.json(
      { error: 'Failed to create sub-agency' },
      { status: 500 }
    )
  }
}
