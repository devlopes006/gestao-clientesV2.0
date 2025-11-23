import { prisma } from '@/lib/prisma'
import { createPresignedPutUrl, generateFileKey } from '@/lib/storage'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params

    // Auth
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, orgId: true },
    })
    if (!client || client.orgId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}) as any)
    const name = body.name as string | undefined
    const mime = body.mime as string | undefined

    if (!name || !mime) {
      return NextResponse.json(
        { error: 'Missing name or mime' },
        { status: 400 }
      )
    }

    const fileKey = generateFileKey(clientId, name)
    const presigned = await createPresignedPutUrl(fileKey, mime, 900)
    if (!presigned) {
      return NextResponse.json(
        { error: 'Presigned uploads not available' },
        { status: 501 }
      )
    }

    return NextResponse.json({ url: presigned, fileKey, expiresIn: 900 })
  } catch (e) {
    console.error('upload-url error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
