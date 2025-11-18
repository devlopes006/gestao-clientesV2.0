import { isAllowedMimeType, uploadFile } from '@/lib/storage'
import { getSessionProfile } from '@/services/auth/session'
import { fileTypeFromBuffer } from 'file-type'
import { NextResponse } from 'next/server'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: Request) {
  try {
    console.log('[Avatar Upload] Iniciando...')

    const { user, orgId } = await getSessionProfile()
    if (!user || !orgId) {
      console.log('[Avatar Upload] Não autorizado')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Avatar Upload] Usuário:', user.id)

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      console.log('[Avatar Upload] Nenhum arquivo recebido')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(
      '[Avatar Upload] Arquivo:',
      file.name,
      file.size,
      'bytes',
      file.type
    )

    if (file.size > MAX_AVATAR_SIZE) {
      console.log('[Avatar Upload] Arquivo muito grande')
      return NextResponse.json(
        { error: 'Arquivo muito grande (máx 5MB)' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      console.log('[Avatar Upload] Não é imagem')
      return NextResponse.json(
        { error: 'Apenas imagens são permitidas' },
        { status: 400 }
      )
    }

    if (!isAllowedMimeType(file.type)) {
      console.log('[Avatar Upload] Tipo não permitido:', file.type)
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    console.log('[Avatar Upload] Buffer criado:', buffer.length, 'bytes')

    // Validar magic bytes
    const detectedType = await fileTypeFromBuffer(buffer)
    console.log('[Avatar Upload] Tipo detectado:', detectedType?.mime)

    if (detectedType && !isAllowedMimeType(detectedType.mime)) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo não permitido. Detectado: ${detectedType.mime}`,
        },
        { status: 400 }
      )
    }

    // Upload para avatars/userId/timestamp
    const fileKey = `avatars/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop() || 'jpg'}`
    console.log('[Avatar Upload] Chave do arquivo:', fileKey)

    const uploadResult = await uploadFile(fileKey, buffer, file.type)
    console.log('[Avatar Upload] Resultado:', uploadResult)

    if (!uploadResult.success) {
      console.error('[Avatar Upload] Falha no upload:', uploadResult.error)
      return NextResponse.json(
        {
          error: 'Falha no upload do arquivo',
          details: uploadResult.error,
        },
        { status: 500 }
      )
    }

    console.log('[Avatar Upload] Sucesso! URL:', uploadResult.url)
    return NextResponse.json({
      url: uploadResult.url,
      thumbUrl: uploadResult.thumbUrl,
    })
  } catch (e) {
    console.error('[Avatar Upload] Erro:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
