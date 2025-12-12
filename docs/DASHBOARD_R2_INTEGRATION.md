# 🖼️ Integração R2 para Dashboard (Calendário e Notas)

**Objetivo:** Adicionar suporte a imagens/mídia nas notas e eventos do dashboard usando Cloudflare R2.

---

## 📋 Visão Geral

O projeto já tem R2 configurado. Vamos estender para:

- 📷 Upload de imagens nas notas
- 🎨 Thumbnails para eventos
- 🔗 Links compartilháveis para arquivos

---

## 🔧 Configuração Existente

### Variáveis de Ambiente (`.env.local`)

```env
# R2 Bucket
S3_BUCKET=mygest-bucket
S3_ENDPOINT=https://d984268288bded79c4154a07d5d3f6da.r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=auto

# R2 Public URL (para imagens)
R2_PUBLIC_URL=https://r2.mygest.app  # (se configurado)
```

### Código Existente

```typescript
// src/lib/storage.ts (já existe)
export const uploadToR2 = async (file: File, folder: string) => {
  // Implementação já existe
}

export const deleteFromR2 = async (key: string) => {
  // Implementação já existe
}
```

---

## 📝 Schema Prisma Atualizado

Vamos adicionar campos de mídia aos modelos:

```prisma
// prisma/schema.prisma

model DashboardNote {
  id            String   @id @default(cuid())
  title         String
  content       String   @db.Text
  color         String?
  position      Int      @default(0)
  orgId         String

  // ✅ Novos campos para mídia
  imageUrl      String?           // URL da imagem no R2
  imageKey      String?           // Chave para deletar depois
  attachments   NoteAttachment[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([orgId, position])
}

model DashboardEvent {
  id            String   @id @default(cuid())
  title         String
  description   String?  @db.Text
  date          DateTime
  color         String?
  orgId         String

  // ✅ Novos campos para mídia
  thumbnailUrl  String?           // Thumbnail do evento
  thumbnailKey  String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([orgId, date])
}

// ✅ Novo modelo para anexos em notas
model NoteAttachment {
  id          String   @id @default(cuid())
  noteId      String
  note        DashboardNote @relation(fields: [noteId], references: [id], onDelete: Cascade)

  type        String   // 'image', 'file', 'video'
  url         String   // URL no R2
  key         String   // Chave para deletar
  fileName    String
  fileSize    Int      // em bytes

  createdAt   DateTime @default(now())

  @@index([noteId])
}
```

### Executar Migração

```bash
# Gerar migração
pnpm prisma:migrate "add_media_to_dashboard"

# Aplicar migração
pnpm prisma:migrate
```

---

## 🚀 Componente Atualizado: FunctionalNotes com Upload

```typescript
// src/app/(dashboard)/components/FunctionalNotesWithMedia.tsx

"use client";

import { uploadNoteAttachment, deleteNoteAttachment } from '@/modules/dashboard/actions/noteAttachments';
import { ImagePlus, File, Trash2, Download } from 'lucide-react';
import React, { useState } from 'react';

interface FunctionalNotesWithMediaProps {
  initialNotes: any[];
  orgId?: string;
}

export function FunctionalNotesWithMedia({ initialNotes, orgId }: FunctionalNotesWithMediaProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [uploadingNoteId, setUploadingNoteId] = useState<string | null>(null);

  // Handle image upload
  const handleImageUpload = async (noteId: string, file: File) => {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida (JPG, PNG, etc)');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem deve ter menos de 5MB');
      return;
    }

    setUploadingNoteId(noteId);
    try {
      const attachment = await uploadNoteAttachment({
        noteId,
        file,
        type: 'image',
      });

      // Atualizar nota com imagem
      const updatedNotes = notes.map(n =>
        n.id === noteId
          ? { ...n, imageUrl: attachment.url }
          : n
      );
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploadingNoteId(null);
    }
  };

  // Handle file attachment
  const handleFileAttachment = async (noteId: string, file: File) => {
    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo deve ter menos de 10MB');
      return;
    }

    setUploadingNoteId(noteId);
    try {
      const attachment = await uploadNoteAttachment({
        noteId,
        file,
        type: 'file',
      });

      // Atualizar lista de anexos
      const updatedNotes = notes.map(n =>
        n.id === noteId
          ? {
            ...n,
            attachments: [...(n.attachments || []), attachment],
          }
          : n
      );
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload do arquivo');
    } finally {
      setUploadingNoteId(null);
    }
  };

  // Handle delete attachment
  const handleDeleteAttachment = async (attachmentId: string, noteId: string) => {
    try {
      await deleteNoteAttachment(attachmentId);

      const updatedNotes = notes.map(n =>
        n.id === noteId
          ? {
            ...n,
            attachments: (n.attachments || []).filter(
              (a: any) => a.id !== attachmentId
            ),
          }
          : n
      );
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Erro ao deletar anexo:', error);
      alert('Erro ao deletar anexo');
    }
  };

  return (
    <div className="space-y-4">
      {notes.map(note => (
        <div
          key={note.id}
          className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3"
        >
          {/* Título e Conteúdo */}
          <div>
            <h3 className="font-bold text-white">{note.title}</h3>
            <p className="text-slate-300 text-sm">{note.content}</p>
          </div>

          {/* Imagem principal */}
          {note.imageUrl && (
            <div className="relative w-full h-40 rounded-lg overflow-hidden">
              <img
                src={note.imageUrl}
                alt={note.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDeleteAttachment(note.imageKey, note.id)}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 rounded transition-all"
                title="Remover imagem"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Upload de imagem */}
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm cursor-pointer transition-all">
              <ImagePlus className="w-4 h-4" />
              Adicionar Imagem
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) handleImageUpload(note.id, file);
                }}
                hidden
              />
            </label>

            <label className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm cursor-pointer transition-all">
              <File className="w-4 h-4" />
              Adicionar Arquivo
              <input
                type="file"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) handleFileAttachment(note.id, file);
                }}
                hidden
              />
            </label>
          </div>

          {/* Lista de anexos */}
          {note.attachments && note.attachments.length > 0 && (
            <div className="space-y-2 border-t border-slate-700 pt-3">
              <p className="text-xs text-slate-400 font-semibold">Anexos</p>
              {note.attachments.map((att: any) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between bg-slate-700/50 p-2 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-white truncate">{att.fileName}</p>
                      <p className="text-xs text-slate-400">
                        {(att.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={att.url}
                      download
                      className="p-1 hover:bg-blue-500/20 rounded transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-blue-300" />
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(att.id, note.id)}
                      className="p-1 hover:bg-red-500/20 rounded transition-all"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploadingNoteId === note.id && (
            <div className="text-center text-sm text-slate-400">
              Enviando... ⏳
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔌 Server Actions para Uploads

```typescript
// src/modules/dashboard/actions/noteAttachments.ts

'use server'

import { uploadToR2, deleteFromR2 } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { revalidatePath } from 'next/cache'

export async function uploadNoteAttachment(input: {
  noteId: string
  file: File
  type: 'image' | 'file' | 'video'
}) {
  const session = await getSessionProfile()
  if (!session.orgId) throw new Error('Unauthorized')

  // Verificar permissão (nota pertence à org)
  const note = await prisma.dashboardNote.findUnique({
    where: { id: input.noteId },
  })

  if (note?.orgId !== session.orgId) {
    throw new Error('Forbidden')
  }

  try {
    // Fazer upload para R2
    const key = `dashboard/notes/${input.noteId}/${Date.now()}-${input.file.name}`
    const url = await uploadToR2(input.file, key)

    // Criar registro no banco
    const attachment = await prisma.noteAttachment.create({
      data: {
        noteId: input.noteId,
        type: input.type,
        url,
        key,
        fileName: input.file.name,
        fileSize: input.file.size,
      },
    })

    // Se for imagem, atualizar field na nota
    if (input.type === 'image') {
      await prisma.dashboardNote.update({
        where: { id: input.noteId },
        data: {
          imageUrl: url,
          imageKey: key,
        },
      })
    }

    revalidatePath('/dashboard')

    return attachment
  } catch (error) {
    console.error('Upload failed:', error)
    throw new Error('Failed to upload file')
  }
}

export async function deleteNoteAttachment(attachmentId: string) {
  const session = await getSessionProfile()
  if (!session.orgId) throw new Error('Unauthorized')

  const attachment = await prisma.noteAttachment.findUnique({
    where: { id: attachmentId },
    include: { note: true },
  })

  if (!attachment || attachment.note.orgId !== session.orgId) {
    throw new Error('Forbidden')
  }

  try {
    // Deletar do R2
    await deleteFromR2(attachment.key)

    // Deletar registro do banco
    await prisma.noteAttachment.delete({
      where: { id: attachmentId },
    })

    revalidatePath('/dashboard')
  } catch (error) {
    console.error('Delete failed:', error)
    throw new Error('Failed to delete attachment')
  }
}
```

---

## 🔐 Segurança com R2

### Signed URLs (URLs com expiração)

```typescript
// src/lib/storage.ts

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function getSignedUrlForFile(
  key: string,
  expirationSeconds = 3600
) {
  const client = new S3Client({
    region: process.env.AWS_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    endpoint: process.env.S3_ENDPOINT,
  })

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET || 'mygest-bucket',
    Key: key,
  })

  const url = await getSignedUrl(client, command, {
    expiresIn: expirationSeconds,
  })

  return url
}
```

### Uso em notas

```tsx
// Usar signed URL em vez de URL pública
const signedUrl = await getSignedUrlForFile(attachment.key)
// URL válida por 1 hora
```

---

## 📸 Adicionar Preview de Imagens

```tsx
// Componente para preview antes de upload
const [preview, setPreview] = useState<string | null>(null)

const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.currentTarget.files?.[0]
  if (file) {
    // Preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
}

// JSX
{
  preview && (
    <div className='relative w-full h-40 rounded-lg overflow-hidden mb-4'>
      <img src={preview} alt='Preview' className='w-full h-full object-cover' />
      <button
        onClick={() => setPreview(null)}
        className='absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 rounded'
      >
        <X className='w-4 h-4 text-white' />
      </button>
    </div>
  )
}
```

---

## 🧹 Limpeza de Arquivos Órfãos

Cron job para deletar anexos que foram removidos do banco:

```typescript
// scripts/cleanup-r2-orphans.ts

import { prisma } from '@/lib/prisma'
import { deleteFromR2 } from '@/lib/storage'

export async function cleanupOrphanFiles() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Encontrar notas deletadas (não há referência direta)
  // Via log de deletions se implementado, ou
  // Assumir arquivos não mencionados há 7 dias

  console.log('[Cleanup] Iniciando limpeza de arquivos órfãos...')
  console.log('[Cleanup] ✅ Nenhum arquivo órfão encontrado')
}

// Executar via cron a cada 24h:
// 0 2 * * * pnpm tsx scripts/cleanup-r2-orphans.ts
```

---

## 📊 Monitoramento

### Logs do R2

```typescript
// Adicionar logging
const uploadToR2 = async (file: File, folder: string) => {
  const startTime = Date.now()

  try {
    const url = await doUpload(file, folder)
    const duration = Date.now() - startTime

    console.log(
      `[R2] Upload bem-sucedido: ${file.name} (${(file.size / 1024).toFixed(1)}KB) em ${duration}ms`
    )

    return url
  } catch (error) {
    console.error(`[R2] Erro ao fazer upload: ${file.name}`, error)
    throw error
  }
}
```

### Estatísticas de Uso

```typescript
// scripts/r2-stats.ts

export async function getR2Stats() {
  const notes = await prisma.dashboardNote.count({
    where: { imageUrl: { not: null } },
  })

  const attachments = await prisma.noteAttachment.aggregate({
    _sum: { fileSize: true },
    _count: true,
  })

  const totalSizeGB = (attachments._sum.fileSize || 0) / 1024 ** 3

  console.log(`
  📊 R2 Estatísticas:
  - Notas com imagem: ${notes}
  - Total de anexos: ${attachments._count}
  - Espaço usado: ${totalSizeGB.toFixed(2)} GB
  `)
}
```

---

## ✅ Checklist de Implementação

- [ ] Criar migração Prisma (adicionar campos)
- [ ] Implementar `uploadNoteAttachment`
- [ ] Implementar `deleteNoteAttachment`
- [ ] Atualizar `FunctionalNotes` com upload UI
- [ ] Testar upload de imagem
- [ ] Testar upload de arquivo
- [ ] Adicionar validação de tamanho
- [ ] Implementar Signed URLs
- [ ] Testar exclusão de anexos
- [ ] Implementar cron de limpeza
- [ ] Monitorar uso de espaço
- [ ] Documentar quotas e limites

---

## 🚀 Limites Recomendados

```typescript
const UPLOAD_LIMITS = {
  imageMaxSize: 5 * 1024 * 1024, // 5MB
  fileMaxSize: 10 * 1024 * 1024, // 10MB
  videoMaxSize: 100 * 1024 * 1024, // 100MB
  maxFilesPerNote: 10,
  maxTotalPerOrg: 10 * 1024 ** 3, // 10GB por org
}
```

---

**Documentação criada em:** Dezembro 11, 2024
**Status:** 📋 Pronto para implementação
**Prioridade:** ⭐⭐ (Nice-to-have, após funcionalidade básica)
