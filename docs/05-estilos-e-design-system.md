# Estilos e Design System

## Configuração Tailwind

- Arquivo: `tailwind.config.ts`.
- darkMode: `class`.
- content: `./src/**/*.{ts,tsx}` e subpastas.
- theme.extend:
  - Colors: baseadas em CSS variables `--primary`, `--secondary`, etc., e `designSystem.colors.slate`.
  - Spacing, Radius, Shadows, Typography: importados de `src/styles/design-system`.
  - BackgroundImage: gradientes brand/warm/cool/emerald/purple/blue/amber.
  - Animations: `fade-in`, `slide-up/down`, `scale-in`, `blob`.
- plugins: utilitários customizados (text gradients, `.page-background`).

## Uso dos Estilos

- Classes Tailwind diretamente nos componentes.
- Presença de design system JavaScript para padronização.

## Design System

- Paleta: controlada via CSS variables + `designSystem.colors.*`.
- Tipografia: `fontFamily`, `fontSize`, `fontWeight` do design system.
- Componentes base: gradientes e utilitários em plugin.

## Pontos de Melhoria

- Evitar repetição de classes: criar componentes UI padronizados (Button, Input, Card).
- Documentar tokens do design system em `docs/` com pré-visualização.
