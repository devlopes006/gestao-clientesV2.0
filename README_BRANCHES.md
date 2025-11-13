# 🎯 Sistema de Branches - Resumo da Configuração

## ✅ O que foi configurado

### 📁 Arquivos Criados

1. **`.github/workflows/ci-dev.yml`**
   - Pipeline de CI para branch `develop`
   - Roda testes e build em PRs

2. **`.github/workflows/ci-prod.yml`**
   - Pipeline de CI/CD para branch `main`
   - Build, testes e deploy automático em produção

3. **`BRANCH_STRATEGY.md`**
   - Documentação completa do fluxo Git Flow
   - Convenções de commits
   - Guia de versionamento semântico

4. **`SETUP_BRANCHES.md`**
   - Guia de setup inicial passo a passo
   - Configuração de proteção de branches no GitHub

5. **`git-flow.sh`**
   - Script auxiliar para facilitar operações Git Flow
   - Comandos: feature, bugfix, hotfix, release

6. **`.env.local.example`**
   - Template de variáveis de ambiente
   - Seguro para commitar (sem secrets)

7. **`.gitignore`** (atualizado)
   - Ignora `.env*.local` exceto `.env.local.example`
   - Configuração adequada para Next.js

### 🔧 Arquivos Modificados

1. **`package.json`**
   - Scripts adicionais para Prisma
   - Scripts de formatação e type-check

2. **`src/context/UserContext.tsx`**
   - Suporte para login mobile via redirect
   - Mantém compatibilidade com desktop

## 🚀 Próximos Passos

### 1. Commitar as mudanças atuais

```bash
git add .
git commit -m "chore: configura sistema de branches e CI/CD

- Adiciona workflows para develop e main
- Cria documentação de Git Flow
- Adiciona script auxiliar git-flow.sh
- Configura .env.local.example
- Atualiza scripts do package.json
- Implementa login mobile com redirect"

git push origin master
```

### 2. Criar branch develop

```bash
git checkout -b develop
git push origin develop
```

### 3. Configurar GitHub

#### a) Mudar branch padrão para develop

- Settings → Branches → Default branch → `develop`

#### b) Proteger branches

- Settings → Branches → Add rule
- Proteger `main` e `develop` (ver SETUP_BRANCHES.md)

#### c) Adicionar Secrets

- Settings → Secrets and variables → Actions
- Adicionar todas as variáveis de .env.local

### 4. Testar o fluxo

```bash
# Criar uma feature de teste
./git-flow.sh feature start teste-sistema-branches

# Fazer uma mudança simples
echo "# Teste" > TEST.md
git add TEST.md
git commit -m "feat: adiciona arquivo de teste"

# Finalizar feature
./git-flow.sh feature finish

# No GitHub: criar PR de feature/teste-sistema-branches → develop
```

## 📋 Checklist de Configuração

- [ ] Commitar mudanças atuais
- [ ] Criar branch `develop`
- [ ] Push de `develop` para origin
- [ ] Mudar branch padrão do repo para `develop`
- [ ] Configurar proteção de `main`
- [ ] Configurar proteção de `develop`
- [ ] Adicionar GitHub Secrets
- [ ] Testar workflow com feature de teste
- [ ] (Opcional) Renomear `master` para `main`

## 🎓 Como usar o sistema

### Desenvolvimento do dia a dia

```bash
# 1. Começar nova feature
./git-flow.sh feature start minha-feature

# 2. Desenvolver e commitar
git add .
git commit -m "feat: implementa funcionalidade X"

# 3. Push e criar PR
./git-flow.sh feature finish
# Criar PR no GitHub: feature/minha-feature → develop
```

### Deploy para produção

```bash
# 1. Criar release
./git-flow.sh release start 1.1.0

# 2. Ajustes finais
# Editar CHANGELOG.md, package.json version, etc

git add .
git commit -m "chore: prepara release v1.1.0"

# 3. Finalizar e deploy
./git-flow.sh release finish
# Automático: merge em main + tag + deploy
```

### Correção urgente em produção

```bash
# 1. Criar hotfix
./git-flow.sh hotfix start corrige-bug-critico

# 2. Corrigir
git add .
git commit -m "fix: corrige bug crítico em produção"

# 3. Deploy urgente
./git-flow.sh hotfix finish 1.0.1
# Automático: merge em main + develop + tag + deploy
```

## 📚 Comandos Úteis

```bash
# Ver ajuda
./git-flow.sh

# Status do repo
./git-flow.sh status

# Sincronizar develop
./git-flow.sh sync

# Limpar branches antigas
./git-flow.sh clean

# Ver branches
git branch -a

# Ver tags/releases
git tag -l

# Ver histórico visual
git log --oneline --graph --all
```

## 🔍 Estrutura de Branches

```
main (produção)
  ↑
  └── release/v1.1.0
        ↑
        develop (integração)
          ↑
          ├── feature/nova-funcionalidade
          ├── feature/outra-feature
          └── bugfix/corrige-erro

hotfix/urgente (direto de main)
  ↓
  └→ main + develop
```

## 🎨 Convenção de Commits

```bash
feat:     nova funcionalidade
fix:      correção de bug
docs:     apenas documentação
style:    formatação, espaços
refactor: refatoração de código
perf:     melhoria de performance
test:     testes
chore:    tarefas, dependências
```

## 🆘 Troubleshooting

### "Permission denied" no git-flow.sh

```bash
chmod +x git-flow.sh
```

### Conflitos em merge

```bash
git status
# Resolver conflitos manualmente nos arquivos
git add .
git commit -m "merge: resolve conflitos"
```

### Desfazer último commit local

```bash
git reset --soft HEAD~1
```

### Branch não existe no remoto

```bash
git push -u origin nome-da-branch
```

## 📞 Suporte

Consulte a documentação completa:

- **BRANCH_STRATEGY.md** - Estratégia detalhada
- **SETUP_BRANCHES.md** - Setup passo a passo
- **MOBILE_LOGIN_FIX.md** - Correção de login mobile

---

**Pronto para começar! 🚀**
