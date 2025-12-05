import { checkRateLimit, getIdentifier, uploadRatelimit } from '@/lib/ratelimit'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { S3Client, UploadPartCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const USE_S3 = process.env.USE_S3 === 'true' || process.env.USE_S3 === '1'
const S3_BUCKET = process.env.STORAGE_BUCKET || process.env.AWS_S3_BUCKET || ''
const endpoint = process.env.STORAGE_ENDPOINT || process.env.AWS_ENDPOINT_URL
const regionEnv = process.env.STORAGE_REGION || process.env.AWS_REGION
const region = endpoint ? regionEnv || 'auto' : regionEnv || 'us-east-1'
const accessKeyId =
  process.env.STORAGE_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
const secretAccessKey =
  process.env.STORAGE_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET_ACCESS_KEY ||
  ''

let s3: S3Client | null = null
if (USE_S3 && S3_BUCKET && accessKeyId && secretAccessKey) {
  const cfg: {
    region: string
    credentials: { accessKeyId: string; secretAccessKey: string }
    endpoint?: string
    forcePathStyle?: boolean
  } = { region, credentials: { accessKeyId, secretAccessKey } }
  if (endpoint) {
    cfg.endpoint = endpoint
    cfg.forcePathStyle = true
  }
  s3 = new S3Client(cfg)
}

export async function POST(req: NextRequest) {
  try {
    const guard = guardAccess(req)
    if (guard) return guard
    // Rate limiting
    const id = getIdentifier(req)
    const rl = await checkRateLimit(id, uploadRatelimit)
    if (!rl.success) {
      const res = NextResponse.json(
        { error: 'Too many requests', resetAt: rl.reset.toISOString() },
        { status: 429 }
      )
      return applySecurityHeaders(req, res)
    }
    if (!s3)
      return NextResponse.json({ error: 'S3 não configurado' }, { status: 500 })
    // Validation
    const schema = z.object({
      originalKey: z.string().min(1),
      uploadId: z.string().min(1),
      partNumber: z.union([z.string(), z.number()]),
    })
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      const res = NextResponse.json(
        { error: 'Parâmetros inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
      return applySecurityHeaders(req, res)
    }
    const { originalKey, uploadId, partNumber } = parsed.data
    const cmd = new UploadPartCommand({
      Bucket: S3_BUCKET,
      Key: originalKey,
      UploadId: uploadId,
      PartNumber: Number(partNumber),
    })
    const url = await getSignedUrl(s3, cmd, { expiresIn: 900 })
    const res = NextResponse.json({ url })
    return applySecurityHeaders(req, res)
  } catch (err) {
    Sentry.addBreadcrumb({
      category: 'upload',
      message: 'multipart sign-part failed',
      level: 'error',
    })
    Sentry.captureException(err)
    const res = NextResponse.json({ error: String(err) }, { status: 500 })
    return applySecurityHeaders(req, res)
  }
}
