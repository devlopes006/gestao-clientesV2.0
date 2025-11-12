# Sistema de Upload e Gerenciamento de Mídias

Este documento detalha o sistema completo de upload de arquivos implementado para o gerenciamento de mídias dos clientes.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Formatos Suportados](#formatos-suportados)
- [Configuração](#configuração)
- [Uso da API](#uso-da-api)
- [Componente Frontend](#componente-frontend)
- [Estrutura de Pastas](#estrutura-de-pastas)

---

## 🎯 Visão Geral

O sistema permite:

- ✅ Upload de arquivos reais (não apenas URLs)
- ✅ Suporte a todos os formatos comuns (imagens, vídeos, documentos, áudio)
- ✅ Organização hierárquica por pastas
- ✅ Armazenamento flexível (S3 ou local)
- ✅ Validação de tipo MIME e tamanho
- ✅ Permissões baseadas em roles (OWNER/STAFF/CLIENT)
- ✅ Preview e download de arquivos

---

## 🏗️ Arquitetura

### Modelo de Dados

#### **MediaFolder** (Pastas hierárquicas)

```prisma
model MediaFolder {
  id          String        @id @default(cuid())
  name        String
  description String?
  parentId    String?
  clientId    String

  // Relações
  parent      MediaFolder?  @relation("FolderHierarchy", fields: [parentId])
  children    MediaFolder[] @relation("FolderHierarchy")
  media       Media[]
  client      Client        @relation(fields: [clientId])

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

#### **Media** (Arquivos)

```prisma
model Media {
  id          String       @id @default(cuid())
  type        MediaType    // image | video | document
  title       String
  description String?
  url         String?      // URL legado (opcional)
  fileKey     String?      // Chave única do arquivo no storage
  mimeType    String?      // Tipo MIME (ex: image/jpeg)
  fileSize    Int?         // Tamanho em bytes
  folderId    String?
  clientId    String

  // Relações
  folder      MediaFolder? @relation(fields: [folderId])
  client      Client       @relation(fields: [clientId])

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

### Camadas

1. **Storage Layer** (`src/lib/storage.ts`)

   - Abstração para S3 ou filesystem local
   - Funções: `uploadFile()`, `deleteFile()`, `getFileUrl()`
   - Validação de MIME types e tamanho

2. **API Layer** (rotas em `src/app/api/clients/[id]/media/`)

   - `POST /upload`: Upload multipart de arquivos
   - `GET/POST/PATCH/DELETE /`: CRUD de mídias
   - `GET/POST/PATCH/DELETE /folders`: CRUD de pastas

3. **Component Layer** (`src/features/clients/components/MediaManager.tsx`)
   - Interface visual com SWR
   - Navegação de pastas
   - Drag-and-drop (pronto para expansão)
   - Modais de upload e gerenciamento

---

## 📦 Formatos Suportados

### Imagens

- JPEG/JPG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)
- SVG (`image/svg+xml`)

### Vídeos

- MP4 (`video/mp4`)
- WebM (`video/webm`)
- OGG (`video/ogg`)
- AVI (`video/x-msvideo`)
- MOV (`video/quicktime`)

### Documentos

- PDF (`application/pdf`)
- Word (`application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- Excel (`application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- PowerPoint (`application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`)
- Texto (`text/plain`, `text/csv`)

### Áudio

- MP3 (`audio/mpeg`)
- WAV (`audio/wav`)
- OGG (`audio/ogg`)

### Limites

- **Tamanho máximo**: 100 MB por arquivo
- Configurável em `src/lib/storage.ts` (constante `MAX_FILE_SIZE`)

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
# Escolha S3 ou armazenamento local
USE_S3="false"  # ou "true" para usar S3

# Se USE_S3=true:
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="sua-access-key"
AWS_SECRET_ACCESS_KEY="sua-secret-key"
AWS_S3_BUCKET="nome-do-bucket"

# Se USE_S3=false:
LOCAL_UPLOAD_DIR="./uploads"
```

### 2. Armazenamento Local (desenvolvimento)

Se usar armazenamento local, crie uma rota estática para servir os arquivos:

```typescript
// next.config.ts
const nextConfig = {
  // ... outras configs
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*', // Rota que serve arquivos estáticos
      },
    ]
  },
}
```

**Ou** configure Next.js para servir a pasta `uploads` como estática (requer `public/uploads` symlink).

### 3. S3 (produção)

1. Crie um bucket S3 na AWS
2. Configure CORS no bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://seu-dominio.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

3. Configure IAM com permissões:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`

---

## 🔌 Uso da API

### Upload de Arquivo

```typescript
// POST /api/clients/[clientId]/media/upload
const formData = new FormData()
formData.append('file', fileObject)
formData.append('title', 'Nome do arquivo')
formData.append('description', 'Descrição opcional')
formData.append('folderId', 'pasta-id') // Opcional

const response = await fetch(`/api/clients/${clientId}/media/upload`, {
  method: 'POST',
  body: formData,
})
```

**Resposta (200)**:

```json
{
  "id": "cm3abc123",
  "type": "image",
  "title": "Nome do arquivo",
  "fileKey": "hash-nome-arquivo.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 204800,
  "url": "https://s3.../hash-nome-arquivo.jpg"
}
```

### Criar Pasta

```typescript
// POST /api/clients/[clientId]/media/folders
const response = await fetch(`/api/clients/${clientId}/media/folders`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Campanhas 2024',
    description: 'Materiais de marketing',
    parentId: null, // Ou ID da pasta pai
  }),
})
```

### Listar Mídias por Pasta

```typescript
// GET /api/clients/[clientId]/media?folderId=pasta-id
const response = await fetch(
  `/api/clients/${clientId}/media?folderId=${folderId}`
)
const media = await response.json() // Array de MediaItem
```

### Deletar Mídia (e arquivo físico)

```typescript
// DELETE /api/clients/[clientId]/media?mediaId=media-id
await fetch(`/api/clients/${clientId}/media?mediaId=${mediaId}`, {
  method: 'DELETE',
})
// O arquivo físico é automaticamente removido do storage
```

---

## 🎨 Componente Frontend

### MediaManager.tsx

**Features**:

- 📁 Navegação breadcrumb por pastas
- 📤 Upload com validação client-side
- 🔍 Busca local de mídias
- ✏️ Edição de título/descrição
- 🗑️ Exclusão com confirmação
- 🔒 Controle de permissões (OWNER/STAFF vê botões, CLIENT não)
- ⚡ SWR com mutações otimistas (sem reload)

**Uso**:

```tsx
import { MediaManager } from '@/features/clients/components/MediaManager'

export default function MediaPage({ params }: { params: { id: string } }) {
  return <MediaManager clientId={params.id} />
}
```

**Permissões**:

- **OWNER/STAFF**: Criar, editar, deletar mídias e pastas
- **CLIENT**: Apenas visualizar

---

## 📂 Estrutura de Pastas

### Exemplo de Hierarquia

```
Cliente XYZ
├── 📁 Campanhas 2024
│   ├── 📁 Janeiro
│   │   ├── 📄 banner-promo.jpg
│   │   └── 🎬 video-institucional.mp4
│   └── 📁 Fevereiro
│       └── 📄 catalogo.pdf
├── 📁 Logos
│   ├── 📄 logo-principal.svg
│   └── 📄 logo-alternativa.png
└── 📄 briefing-inicial.pdf (raiz)
```

### Comportamento de Exclusão

- **Deletar pasta**: Remove a pasta, subpastas e define `folderId = null` nas mídias (arquivos físicos permanecem)
- **Deletar mídia**: Remove o registro do banco E o arquivo físico do storage

---

## 🔐 Segurança

### Validações Implementadas

1. **MIME Type Whitelist**: Apenas formatos permitidos (ver `isAllowedMimeType()`)
2. **Tamanho máximo**: 100 MB por arquivo
3. **Sanitização de nomes**: Remove caracteres especiais, previne path traversal
4. **Permissões**: Middleware verifica `can(role, action, 'media')`
5. **Client isolation**: Mídias sempre vinculadas ao `clientId` correto

### Melhorias Futuras

- [ ] Rate limiting no upload
- [ ] Scan de vírus/malware
- [ ] Compressão automática de imagens (Sharp)
- [ ] Thumbnails/previews para vídeos
- [ ] Drag-and-drop de múltiplos arquivos
- [ ] Barra de progresso de upload
- [ ] Tags e metadados customizados

---

## 🧪 Testando

### Teste de Upload Local

1. Configure `.env`: `USE_S3="false"` e `LOCAL_UPLOAD_DIR="./uploads"`
2. Inicie o servidor: `pnpm dev`
3. Acesse `/clients/[id]/media`
4. Clique em "Upload" e selecione um arquivo
5. Verifique que o arquivo foi salvo em `./uploads/`

### Teste de Upload S3

1. Configure variáveis AWS no `.env`
2. Crie um bucket de teste
3. Repita o processo de upload
4. Verifique que o arquivo aparece no bucket S3

---

## 📚 Referências

- [Prisma Docs: Self-Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/self-relations)
- [AWS SDK v3: S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Next.js: Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [SWR Docs: Mutation](https://swr.vercel.app/docs/mutation)

---

**Desenvolvido para o Sistema de Gestão de Clientes** | Última atualização: 2024
