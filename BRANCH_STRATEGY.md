# Estratégia de Branches - MyGest

## Estrutura de Branches

### 🌳 Branches Principais

#### `main` (Produção)

- **Propósito**: Código em produção
- **Proteção**: Branch protegida
- **Deploy**: Automático para produção
- **Merges**: Apenas via Pull Request de `develop`
- **Tags**: Cada release recebe uma tag (v1.0.0, v1.1.0, etc)

#### `develop` (Desenvolvimento)

- **Propósito**: Integração de features
- **Proteção**: Branch protegida (opcional)
- **Deploy**: Pode ter ambiente de staging
- **Merges**: Features, bugfixes, hotfixes

### 🔀 Branches de Trabalho

#### Feature Branches (`feature/nome-da-feature`)

```bash
# Criar nova feature
git checkout develop
git pull origin develop
git checkout -b feature/pagamento-pix
```

**Quando usar:**

- Novas funcionalidades
- Melhorias significativas
- Refatorações grandes

**Exemplo:**

- `feature/login-biometrico`
- `feature/relatorio-financeiro`
- `feature/integracao-whatsapp`

#### Bugfix Branches (`bugfix/descricao-do-bug`)

```bash
# Corrigir bug em desenvolvimento
git checkout develop
git checkout -b bugfix/corrige-upload-imagem
```

**Quando usar:**

- Bugs encontrados em desenvolvimento
- Correções antes do release

#### Hotfix Branches (`hotfix/descricao-urgente`)

```bash
# Correção urgente em produção
git checkout main
git checkout -b hotfix/corrige-login-mobile
```

**Quando usar:**

- Bugs críticos em produção
- Problemas de segurança urgentes
- Correções que não podem esperar próximo release

**Fluxo especial:**

```bash
# Após correção
git checkout main
git merge hotfix/corrige-login-mobile
git tag -a v1.0.1 -m "Hotfix: corrige login mobile"
git push origin main --tags

# Também aplicar em develop
git checkout develop
git merge hotfix/corrige-login-mobile
git push origin develop

# Deletar branch
git branch -d hotfix/corrige-login-mobile
```

## 📋 Fluxo de Trabalho

### 1. Nova Feature

```bash
# 1. Criar branch da feature
git checkout develop
git pull origin develop
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver e commitar
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 3. Push para o repositório
git push origin feature/nova-funcionalidade

# 4. Criar Pull Request
# No GitHub: feature/nova-funcionalidade -> develop

# 5. Após review e merge, deletar branch local
git checkout develop
git pull origin develop
git branch -d feature/nova-funcionalidade
```

### 2. Release para Produção

```bash
# 1. Criar release branch
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Ajustes finais (versão, changelog, etc)
# Editar package.json, CHANGELOG.md

git add .
git commit -m "chore: prepara release v1.2.0"

# 3. Merge em main
git checkout main
git pull origin main
git merge release/v1.2.0
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main --tags

# 4. Merge de volta em develop
git checkout develop
git merge release/v1.2.0
git push origin develop

# 5. Deletar branch de release
git branch -d release/v1.2.0
```

### 3. Hotfix em Produção

```bash
# 1. Criar hotfix
git checkout main
git pull origin main
git checkout -b hotfix/corrige-bug-critico

# 2. Corrigir
git add .
git commit -m "fix: corrige bug crítico em produção"

# 3. Merge em main
git checkout main
git merge hotfix/corrige-bug-critico
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin main --tags

# 4. Merge em develop
git checkout develop
git merge hotfix/corrige-bug-critico
git push origin develop

# 5. Cleanup
git branch -d hotfix/corrige-bug-critico
```

## 🔒 Proteção de Branches

### Configurar no GitHub

1. **Settings** → **Branches** → **Add rule**

#### Para `main`:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass (CI)
- ✅ Require branches to be up to date
- ✅ Include administrators
- ✅ Restrict who can push to matching branches

#### Para `develop`:

- ✅ Require pull request reviews (opcional)
- ✅ Require status checks to pass (CI)

## 🚀 CI/CD

### Ambientes

| Branch      | Ambiente | Deploy     | URL                    |
| ----------- | -------- | ---------- | ---------------------- |
| `main`      | Produção | Automático | app.mygest.com         |
| `develop`   | Staging  | Automático | staging.mygest.com     |
| `feature/*` | Preview  | Manual     | feature-xyz.mygest.com |

### Pipelines Criados

- `.github/workflows/ci-dev.yml` - Testa PRs para develop
- `.github/workflows/ci-prod.yml` - Testa e deploya main

## 📝 Convenção de Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: adiciona novo recurso
fix: corrige um bug
docs: apenas documentação
style: formatação, ponto e vírgula, etc
refactor: refatoração de código
perf: melhoria de performance
test: adiciona testes
chore: atualiza dependências, build, etc
```

**Exemplos:**

```bash
git commit -m "feat: adiciona login mobile com redirect"
git commit -m "fix: corrige erro de parse no info page"
git commit -m "docs: atualiza guia de branches"
git commit -m "chore: atualiza Next.js para 16.0.1"
```

## 🔄 Workflow Diário

### Desenvolvedor

```bash
# Manhã: atualizar develop
git checkout develop
git pull origin develop

# Criar feature
git checkout -b feature/minha-feature

# Trabalhar...
git add .
git commit -m "feat: implementa parte X"

# Fim do dia: push
git push origin feature/minha-feature

# Quando pronto: criar PR no GitHub
```

### Code Review

1. ✅ Código compila sem erros
2. ✅ Testes passam (quando houver)
3. ✅ Segue padrões do projeto
4. ✅ Não quebra funcionalidades existentes
5. ✅ Commits bem descritos

## 🎯 Setup Inicial

### 1. Criar Branch Develop

```bash
# Criar develop a partir de master atual
git checkout master
git pull origin master
git checkout -b develop
git push origin develop
```

### 2. Renomear master para main (opcional)

```bash
# Localmente
git branch -m master main
git push origin main
git push origin --delete master

# No GitHub: Settings → Branches → Default branch → main
```

### 3. Proteger Branches

No GitHub:

- **Settings** → **Branches** → **Add rule**
- Proteger `main` e `develop`

### 4. Configurar Secrets

No GitHub:

- **Settings** → **Secrets and variables** → **Actions**
- Adicionar todas as variáveis de ambiente necessárias

## 🆘 Comandos Úteis

```bash
# Ver todas as branches
git branch -a

# Deletar branch local
git branch -d nome-da-branch

# Deletar branch remota
git push origin --delete nome-da-branch

# Limpar branches deletadas remotamente
git fetch --prune

# Ver histórico de branches
git log --oneline --graph --all

# Atualizar develop local
git checkout develop && git pull origin develop

# Ver diferença entre branches
git diff develop main
```

## 📊 Versionamento Semântico

Seguir [SemVer](https://semver.org/):

- **v1.0.0** → Release inicial
- **v1.1.0** → Nova feature (minor)
- **v1.1.1** → Bugfix (patch)
- **v2.0.0** → Breaking change (major)

```bash
# Criar tag
git tag -a v1.2.0 -m "Release v1.2.0: Adiciona dashboard analytics"
git push origin v1.2.0

# Listar tags
git tag -l

# Ver detalhes de uma tag
git show v1.2.0
```

## 🔍 Troubleshooting

### Conflitos em merge

```bash
# Resolver conflitos manualmente
git status
# Editar arquivos em conflito
git add .
git commit -m "merge: resolve conflitos"
```

### Desfazer último commit local

```bash
git reset --soft HEAD~1
```

### Reverter commit já pushado

```bash
git revert COMMIT_HASH
git push origin branch-name
```

## 📚 Recursos

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
