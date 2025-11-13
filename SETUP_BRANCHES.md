# Setup - Sistema de Branches

## 🚀 Setup Inicial (Execute Uma Vez)

### 1. Criar Branch Develop

```bash
# Commitar mudanças atuais primeiro
git add .
git commit -m "chore: adiciona estrutura de branches e CI/CD"

# Criar develop
git checkout -b develop
git push origin develop
```

### 2. Configurar Branch Padrão no GitHub

1. Acesse: **Settings** → **Branches**
2. Em "Default branch", clique em ⇄
3. Selecione `develop`
4. Confirme a mudança

### 3. Proteger Branches Principais

#### Proteger `main`:

1. **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Marcar:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings

#### Proteger `develop`:

1. **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `develop`
3. Marcar:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

### 4. Configurar GitHub Secrets

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Adicionar:

```
DATABASE_URL
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

### 5. Renomear master → main (Opcional)

```bash
# Local
git branch -m master main
git push origin main

# No GitHub
# Settings → Default branch → main
# Depois:
git push origin --delete master
```

## ✅ Verificação

```bash
# Ver branches
git branch -a

# Deve mostrar:
#   develop
# * main (ou master)
```

## 📝 Próximos Passos

Agora você pode começar a trabalhar com o fluxo:

```bash
# Criar uma feature
./git-flow.sh feature start nome-da-feature

# Ver ajuda completa
./git-flow.sh
```

## 🔧 Comandos Úteis

```bash
# Ver status
./git-flow.sh status

# Sincronizar develop
./git-flow.sh sync

# Limpar branches antigas
./git-flow.sh clean
```

## 📚 Documentação Completa

Consulte `BRANCH_STRATEGY.md` para detalhes completos do fluxo de trabalho.
