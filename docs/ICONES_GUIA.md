# Guia de Ícones da Aplicação

## Arquivos Necessários

Para ter ícones completos em todos os dispositivos e navegadores, adicione os seguintes arquivos na pasta `src/app`:

### 1. Favicon (ICO)

- **Arquivo**: `favicon.ico`
- **Dimensões**: 16x16, 32x32, 48x48 (multi-size ICO)
- **Localização**: `src/app/favicon.ico`

### 2. Apple Touch Icon

- **Arquivo**: `apple-touch-icon.png` ou `apple-icon.png`
- **Dimensões**: 180x180px
- **Localização**: `src/app/apple-icon.png`
- **Uso**: Ícone quando site é adicionado na tela inicial do iOS

### 3. Ícones do App (Android/PWA)

- **Arquivos**: `icon.png` ou arquivo específico com dimensões
- **Dimensões recomendadas**:
  - 192x192px (mínimo)
  - 512x512px (recomendado)
- **Localização**: `src/app/icon.png`

### 4. Open Graph Image

- **Arquivo**: `og-image.png` ou `opengraph-image.png`
- **Dimensões**: 1200x630px
- **Localização**: `src/app/opengraph-image.png`
- **Uso**: Preview quando link é compartilhado em redes sociais

### 5. Twitter Card Image

- **Arquivo**: `twitter-image.png`
- **Dimensões**: 1200x675px (ou 1200x630px)
- **Localização**: `src/app/twitter-image.png`

## Como Gerar os Ícones

### Opção 1: Usando Ferramenta Online

1. Acesse: https://realfavicongenerator.net/
2. Faça upload do logo da empresa (formato SVG ou PNG de alta resolução)
3. Configure as opções para cada plataforma
4. Baixe o pacote gerado
5. Extraia e coloque os arquivos na pasta `src/app`

### Opção 2: Usando Next.js (Recomendado)

Next.js 13+ detecta automaticamente estes arquivos na pasta `app`:

```
src/app/
  ├── favicon.ico          # Auto-detectado
  ├── icon.png             # Auto-detectado (ou icon.ico, icon.svg)
  ├── apple-icon.png       # Auto-detectado
  ├── opengraph-image.png  # Auto-detectado
  └── twitter-image.png    # Auto-detectado
```

Se você tiver um SVG do logo, pode criar `icon.tsx`:

```typescript
import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%',
        }}
      >
        M
      </div>
    ),
    { ...size }
  )
}
```

### Opção 3: Geração Manual

#### Requisitos da Imagem Original:

- Formato: PNG ou SVG
- Resolução mínima: 512x512px
- Fundo: Transparente (recomendado)

#### Ferramentas Recomendadas:

- **Photoshop/GIMP**: Para edição manual
- **Inkscape**: Para vetores SVG
- **ImageMagick**: Para conversão em lote via linha de comando

```bash
# Exemplo com ImageMagick
convert logo.png -resize 16x16 favicon-16x16.png
convert logo.png -resize 32x32 favicon-32x32.png
convert logo.png -resize 180x180 apple-icon.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 512x512 icon-512x512.png

# Combinar em ICO multi-size
convert favicon-16x16.png favicon-32x32.png favicon.ico
```

## Web App Manifest

Se você criar um arquivo `manifest.json` (ou `manifest.webmanifest`), adicione também:

```json
{
  "name": "MyGest",
  "short_name": "MyGest",
  "description": "Sistema de Gestão de Clientes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## Verificação

Após adicionar os arquivos, verifique:

1. **Browser DevTools**: Inspecione o `<head>` para ver se os links de ícones foram gerados
2. **Lighthouse**: Execute audit de PWA
3. **Teste em dispositivos**: iOS Safari, Chrome Android, etc.
4. **Social Media Debuggers**:
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

## Ícones Atuais (Temporários)

Atualmente a aplicação usa ícones placeholder do Next.js. Para produção, **substitua pelos ícones oficiais da marca MyGest**.

### Checklist de Implementação

- [ ] Obter logo oficial da empresa (SVG ou PNG alta resolução)
- [ ] Gerar favicon.ico (16x16, 32x32)
- [ ] Gerar apple-icon.png (180x180)
- [ ] Gerar icon.png (192x192 e 512x512)
- [ ] Gerar opengraph-image.png (1200x630)
- [ ] Criar manifest.json (opcional, para PWA)
- [ ] Testar em múltiplos navegadores
- [ ] Testar preview em redes sociais

## Recursos Úteis

- Next.js Metadata Files: https://nextjs.org/docs/app/api-reference/file-conventions/metadata
- Favicon Generator: https://realfavicongenerator.net/
- PWA Manifest Generator: https://www.simicart.com/manifest-generator.html/
- Image Optimization: https://squoosh.app/
