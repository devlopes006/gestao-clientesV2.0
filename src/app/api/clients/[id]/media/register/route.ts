import { prisma } from '@/lib/prisma'
import { getFileUrl, getMediaTypeFromMime } from '@/lib/storage'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest | Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId || !role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, orgId: true },
    })
    if (!client || client.orgId !== orgId)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = (await req.json().catch(() => ({}))) as {
      fileKey?: string
      mimeType?: string
      title?: string
      description?: string | null
      tags?: string[]
      folderId?: string | null
      fileSize?: number | null
    }
    const { fileKey, mimeType, title, description, tags, folderId, fileSize } =
      body
    if (!fileKey || !mimeType)
      return NextResponse.json(
        { error: 'Missing fileKey or mimeType' },
        { status: 400 }
      )

    try {
      // Compute a public or signed URL for the uploaded file (works for S3/R2 or local)
      const url = await getFileUrl(fileKey, 60 * 60 * 24 * 7).catch(
        () => `/uploads/${fileKey}`
      )

      const media = await prisma.media.create({
        data: {
          title: title || fileKey.split('/').pop() || 'Untitled',
          description: description || null,
          fileKey,
          mimeType,
          fileSize: fileSize || null,
          url,
          thumbUrl: null,
          type: getMediaTypeFromMime(mimeType),
          folderId: folderId || null,
          tags: tags || [],
          clientId,
          orgId,
        },
      })
      return NextResponse.json(media)
    } catch (dbErr) {
      console.error('register media failed', dbErr)
      return NextResponse.json(
        { error: 'DB error', details: String(dbErr) },
        { status: 500 }
      )
    }
  } catch (e) {
    console.error('register route error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
