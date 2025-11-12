# Instalação de Dependências

Devido a um problema de permissões durante a instalação automática, você precisa instalar manualmente as seguintes dependências:

```bash
pnpm add swr sonner lucide-react
```

## Pacotes Instalados

- **swr**: Data fetching library com cache e revalidação
- **sonner**: Toast notifications elegantes
- **lucide-react**: Biblioteca de ícones React

## O que foi implementado

### Componentes UI (padrão shadcn/ui)
- ✅ Badge
- ✅ Button (com variants)
- ✅ Card (com subcomponentes)
- ✅ Input
- ✅ Label
- ✅ Select
- ✅ Textarea
- ✅ Toaster (para notificações)

### Funcionalidades Admin
- ✅ `src/app/(app)/admin/page.tsx` - Página admin com guard (apenas OWNER)
- ✅ `src/app/(app)/admin/members/page.tsx` - Lista de membros com gestão
- ✅ `src/app/(app)/admin/members/actions.ts` - Server actions (update, delete)
- ✅ `src/app/api/members/route.ts` - API para buscar membros
- ✅ `src/features/admin/components/DeleteMemberButton.tsx` - Botão de deletar com confirmação

### Melhorias
- ✅ `getSessionProfile()` agora retorna `role` do membro
- ✅ Guard de permissões (apenas OWNER acessa admin)
- ✅ Toaster adicionado ao layout global

## Próximos Passos

1. Execute a instalação das dependências:
   ```bash
   pnpm add swr sonner lucide-react
   ```

2. Verifique se o servidor está rodando:
   ```bash
   pnpm dev
   ```

3. Acesse a página admin em:
   ```
   http://localhost:3000/admin
   ```

## Notas

- **Convites**: A funcionalidade de convites está como stub. Para implementar completamente, seria necessário:
  - Criar tabela `Invite` no Prisma
  - Implementar envio de emails
  - Criar rota de aceite de convite
  
- **Permissões**: Apenas usuários com role `OWNER` podem acessar `/admin`

- **Erros de build**: Os erros de TypeScript sobre módulos não encontrados serão resolvidos após instalar as dependências.
