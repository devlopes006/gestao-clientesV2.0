import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/uploads/presign
 * Body: { fileName: string, contentType: string, clientId?: string }
 * Returns: { key: string, url: string, method: 'PUT' }
 */
export async function POST(req: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = (await req.json()) as {
      fileName?: string
      contentType?: string
      clientId?: string
    }
    const { fileName, contentType, clientId } = body || {}

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      )
    }

    if (clientId) {
      if (!role || !can(role, 'create', 'media'))
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
      const client = await prisma.client.findFirst({
        where: { id: clientId, orgId },
        select: { id: true },
      })
      if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Only supports S3-compatible storages for presign
    if (process.env.USE_S3 !== 'true') {
      return NextResponse.json(
        { error: 'Presign disponível apenas com S3 ativado (USE_S3=true)' },
        { status: 400 }
      )
    }

    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      ...(process.env.AWS_ENDPOINT_URL
        ? { endpoint: process.env.AWS_ENDPOINT_URL, forcePathStyle: true }
        : {}),
    })

    const bucket = process.env.AWS_S3_BUCKET || ''
    if (!bucket) {
      return NextResponse.json(
        { error: 'Bucket S3 não configurado' },
        { status: 500 }
      )
    }

    // Build key path (optionally include client folder)
    const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const key = clientId ? `clients/${clientId}/${Date.now()}_${safeName}` : `uploads/${Date.now()}_${safeName}`

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })
    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }) // 5 min

    return NextResponse.json({ key, url, method: 'PUT' })
  } catch (e) {
    console.error('Presign error:', e)
    return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 })
  }
}
