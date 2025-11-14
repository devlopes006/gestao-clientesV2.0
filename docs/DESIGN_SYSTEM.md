# Sistema de Design - MyGest

## Índice

1. [Cores](#cores)
2. [Tipografia](#tipografia)
3. [Espaçamentos](#espaçamentos)
4. [Bordas e Raios](#bordas-e-raios)
5. [Sombras](#sombras)
6. [Componentes](#componentes)
7. [Layout](#layout)

---

## Cores

### Cores Primárias

```css
/* Brand Colors */
--brand-primary: #3b82f6; /* Blue 500 */
--brand-primary-light: #60a5fa; /* Blue 400 */
--brand-primary-dark: #2563eb; /* Blue 600 */
--brand-secondary: #8b5cf6; /* Purple 500 */
--brand-secondary-light: #a78bfa; /* Purple 400 */
--brand-secondary-dark: #7c3aed; /* Purple 600 */

/* Gradient */
--brand-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
```

### Cores de Status

```css
/* Success */
--success: #10b981; /* Green 500 */
--success-light: #34d399; /* Green 400 */
--success-dark: #059669; /* Green 600 */
--success-bg: #d1fae5; /* Green 100 */

/* Warning */
--warning: #f59e0b; /* Amber 500 */
--warning-light: #fbbf24; /* Amber 400 */
--warning-dark: #d97706; /* Amber 600 */
--warning-bg: #fef3c7; /* Amber 100 */

/* Error */
--error: #ef4444; /* Red 500 */
--error-light: #f87171; /* Red 400 */
--error-dark: #dc2626; /* Red 600 */
--error-bg: #fee2e2; /* Red 100 */

/* Info */
--info: #3b82f6; /* Blue 500 */
--info-light: #60a5fa; /* Blue 400 */
--info-dark: #2563eb; /* Blue 600 */
--info-bg: #dbeafe; /* Blue 100 */
```

### Cores Neutras

```css
/* Escala de cinza */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
--gray-950: #030712;
```

### Modo Dark

```css
/* Dark Mode Backgrounds */
--dark-bg-primary: #0f172a; /* Slate 900 */
--dark-bg-secondary: #1e293b; /* Slate 800 */
--dark-bg-tertiary: #334155; /* Slate 700 */

/* Dark Mode Text */
--dark-text-primary: #f1f5f9; /* Slate 100 */
--dark-text-secondary: #cbd5e1; /* Slate 300 */
--dark-text-tertiary: #94a3b8; /* Slate 400 */
```

### Uso no Código

```tsx
// Tailwind Classes
<div className="bg-blue-500 text-white">Primary Action</div>
<div className="bg-gradient-to-r from-blue-500 to-purple-500">Gradient</div>

// Status Colors
<span className="text-green-600">Success</span>
<span className="text-amber-600">Warning</span>
<span className="text-red-600">Error</span>

// Dark Mode
<div className="bg-slate-900 dark:bg-slate-950">Content</div>
```

---

## Tipografia

### Fonte Padrão

```css
font-family: 'Inter', system-ui, sans-serif;
```

### Escala de Tamanhos

```css
/* Text Sizes */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
--text-5xl: 3rem; /* 48px */
```

### Pesos de Fonte

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights

```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Uso no Código

```tsx
// Headings
<h1 className="text-4xl font-bold leading-tight">Título Principal</h1>
<h2 className="text-3xl font-semibold">Subtítulo</h2>
<h3 className="text-2xl font-medium">Seção</h3>

// Body Text
<p className="text-base leading-relaxed">Texto normal</p>
<span className="text-sm text-gray-600">Texto secundário</span>
<small className="text-xs text-gray-500">Nota de rodapé</small>
```

---

## Espaçamentos

### Escala de Spacing

```css
--spacing-0: 0;
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-5: 1.25rem; /* 20px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-10: 2.5rem; /* 40px */
--spacing-12: 3rem; /* 48px */
--spacing-16: 4rem; /* 64px */
--spacing-20: 5rem; /* 80px */
--spacing-24: 6rem; /* 96px */
```

### Container Sizes

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Uso no Código

```tsx
// Padding
<div className="p-4">Padding 16px em todos os lados</div>
<div className="px-6 py-4">Horizontal 24px, Vertical 16px</div>

// Margin
<div className="mb-6">Margin bottom 24px</div>
<div className="space-y-4">Gap vertical 16px entre filhos</div>

// Gap (Flexbox/Grid)
<div className="flex gap-4">Gap 16px</div>
<div className="grid grid-cols-3 gap-6">Gap 24px</div>
```

---

## Bordas e Raios

### Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem; /* 2px */
--radius-base: 0.25rem; /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 0.75rem; /* 12px */
--radius-2xl: 1rem; /* 16px */
--radius-3xl: 1.5rem; /* 24px */
--radius-full: 9999px; /* Circular */
```

### Border Widths

```css
--border-0: 0;
--border-1: 1px;
--border-2: 2px;
--border-4: 4px;
```

### Uso no Código

```tsx
// Bordas arredondadas
<div className="rounded-lg">8px radius</div>
<div className="rounded-2xl">16px radius</div>
<button className="rounded-full">Botão circular</button>

// Bordas
<div className="border border-gray-200">Borda 1px</div>
<div className="border-2 border-blue-500">Borda 2px azul</div>
```

---

## Sombras

### Shadow Scale

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl:
  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

### Uso no Código

```tsx
// Sombras
<div className="shadow-sm">Sombra pequena</div>
<div className="shadow-lg">Sombra grande</div>
<div className="shadow-xl">Sombra extra grande</div>

// Hover states
<button className="shadow-md hover:shadow-lg transition-shadow">
  Hover para aumentar sombra
</button>
```

---

## Componentes

### Botões

#### Variantes

```tsx
// Primary
<Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all">
  Primary Button
</Button>

// Secondary
<Button className="bg-white border-2 border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-lg hover:border-gray-400 transition-colors">
  Secondary Button
</Button>

// Destructive
<Button className="bg-red-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-600 transition-colors">
  Delete
</Button>

// Ghost
<Button className="text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
  Ghost Button
</Button>
```

#### Tamanhos

```tsx
// Small
<Button className="px-3 py-1.5 text-sm">Small</Button>

// Medium (default)
<Button className="px-6 py-3 text-base">Medium</Button>

// Large
<Button className="px-8 py-4 text-lg">Large</Button>
```

### Cards

```tsx
// Card padrão
<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-800 p-6">
  <h3 className="text-xl font-semibold mb-4">Card Title</h3>
  <p className="text-gray-600 dark:text-slate-400">Card content</p>
</div>

// Card com hover
<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md hover:shadow-xl border border-gray-200 dark:border-slate-800 p-6 transition-shadow cursor-pointer">
  Interactive Card
</div>
```

### Inputs

```tsx
// Input padrão
<input
  type="text"
  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
  placeholder="Enter text..."
/>

// Input com erro
<input
  className="w-full px-4 py-3 border-2 border-red-500 rounded-lg focus:ring-2 focus:ring-red-500"
/>

// Select
<select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Badges

```tsx
// Status badges
<span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
  Active
</span>

<span className="px-3 py-1 text-sm font-medium bg-amber-100 text-amber-800 rounded-full">
  Pending
</span>

<span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
  Inactive
</span>
```

---

## Layout

### Container

```tsx
// Container centralizado com max-width
<div className='container mx-auto px-4 max-w-7xl'>Content</div>
```

### Grid Layouts

```tsx
// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Grid com auto-fit
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
  Cards auto-ajustáveis
</div>
```

### Flex Layouts

```tsx
// Flex horizontal com espaçamento
<div className="flex items-center justify-between gap-4">
  <div>Left</div>
  <div>Right</div>
</div>

// Flex vertical
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Flex responsivo
<div className="flex flex-col md:flex-row gap-4">
  Vertical em mobile, horizontal em desktop
</div>
```

### Page Layout

```tsx
// Layout padrão de página
<div className='min-h-screen bg-gray-50 dark:bg-slate-950'>
  {/* Header */}
  <header className='bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800'>
    <div className='container mx-auto px-4 py-4'>Header content</div>
  </header>

  {/* Main Content */}
  <main className='container mx-auto px-4 py-8'>
    <div className='max-w-7xl mx-auto'>Page content</div>
  </main>

  {/* Footer */}
  <footer className='bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 mt-auto'>
    <div className='container mx-auto px-4 py-6'>Footer content</div>
  </footer>
</div>
```

---

## Transições e Animações

### Transições Padrão

```tsx
// Transition all
<div className="transition-all duration-200 ease-in-out">
  Anima todas propriedades
</div>

// Transition específicas
<div className="transition-colors duration-300">Cores</div>
<div className="transition-transform duration-200">Transform</div>
<div className="transition-opacity duration-150">Opacity</div>
```

### Hover States

```tsx
<button className="transform hover:scale-105 transition-transform">
  Scale on hover
</button>

<div className="opacity-80 hover:opacity-100 transition-opacity">
  Fade in on hover
</div>
```

### Animações

```tsx
// Fade in
<div className="animate-fade-in">Fade In</div>

// Slide in
<div className="animate-slide-in-bottom">Slide In</div>

// Pulse
<div className="animate-pulse">Loading...</div>

// Spin
<div className="animate-spin">Loading spinner</div>
```

---

## Breakpoints Responsivos

```css
/* Mobile first */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Desktops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Extra large screens */
```

### Uso

```tsx
<div className="text-sm md:text-base lg:text-lg xl:text-xl">
  Texto responsivo
</div>

<div className="p-4 md:p-6 lg:p-8">
  Padding responsivo
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  Grid responsivo
</div>
```

---

## Acessibilidade

### Focus States

```tsx
// Focus ring padrão
<button className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none">
  Acessível
</button>

// Focus visible (só teclado)
<a className="focus-visible:ring-2 focus-visible:ring-blue-500 outline-none">
  Link
</a>
```

### Screen Reader Only

```tsx
<span className='sr-only'>Texto apenas para leitores de tela</span>
```

---

## Boas Práticas

1. **Consistência**: Use sempre as mesmas classes para elementos similares
2. **Responsividade**: Pense mobile-first
3. **Dark Mode**: Sempre inclua suporte com `dark:`
4. **Acessibilidade**: Inclua focus states e aria-labels
5. **Performance**: Use `transition-*` apenas quando necessário
6. **Reutilização**: Crie componentes para padrões repetidos

---

## Recursos

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors)
- [Headless UI](https://headlessui.com/) - Componentes acessíveis
- [Radix UI](https://www.radix-ui.com/) - Primitives acessíveis
