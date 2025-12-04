# Componentes e Interfaces

## Páginas/Rotas

- `src/app/layout.tsx`: layout raiz.
- `src/app/page.tsx`: landing/home.
- `src/app/dashboard/page.tsx`: dashboard de métricas.
- `src/app/login/page.tsx`: login/autenticação.
- `src/app/media/*`: biblioteca de mídia.
- `src/app/client/*`: gestão de cliente.

## Componentes de UI

- Reutilizáveis: botões, inputs, modais (Radix UI), componentes visuais (Lucide, framer-motion).
- Branding: `src/components/branding/BrandingPage.tsx` (página/fluxo de branding do cliente).

## Hooks Customizados

- Uso de React Query sugere hooks `useQuery`/`useMutation` por feature.

## Contextos

- Tema: `next-themes`.
- Sessão/Org: helpers em `src/services/org/session.ts` consumidos por páginas/APIs.

## Estado Global

- React Query para cache remoto; Context API para tema/sessão.

## Pontos de Melhoria

- Componentes muito grandes: quebrar em subcomponentes (containers x apresentação).
- Evitar lógica de domínio na UI: mover para `src/services/**`.
- Padronizar nomes e props; adotar Zod para schemas de props complexas.
