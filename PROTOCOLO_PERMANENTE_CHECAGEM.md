# 📋 PROTOCOLO PERMANENTE DE CHECAGEM - PÓS IMPLEMENTAÇÃO

**Efetivo a partir de**: 22 de Dezembro de 2024  
**Escopo**: Todas as fases de implementação (Fase 2 em diante)  
**Objetivo**: Garantir 100% funcionalidade e type-safety antes de qualquer merge

---

## 🎯 VISÃO GERAL

Após **CADA finalização** de funcionalidade/fase, você DEVE executar este protocolo completo. Ele garante:

✅ Zero erros TypeScript  
✅ Zero warnings  
✅ Type-safe code (sem `any`)  
✅ Documentação atualizada  
✅ Status de bloqueadores identificados

**Tempo estimado**: 15-20 minutos por fase

---

## ✅ CHECKLIST EXECUTÁVEL

### PASSO 1: Validação TypeScript (2 min)

```bash
# Rodar type-check
cd /c/Users/devel/projetos/gestao-clientes
pnpm run type-check 2>&1

# ✅ Se passar: continuar para Passo 2
# ❌ Se falhar: PARAR e corrigir erros
```

**Resultado esperado**: Sem output (exit code 0)

**Se tiver erros**:

```bash
# Mostrar primeiros 20 erros para inspecionar
pnpm run type-check 2>&1 | head -50
```

### PASSO 2: Procurar por `any` em Código Novo (3 min)

```bash
# Procurar qualquer ocorrência de 'any' em código novo
cd /c/Users/devel/projetos/gestao-clientes

# Se você editou apenas alguns arquivos, procure neles especificamente
# Exemplo: Se trabalhou em Fase 2 (Session)
grep -r ": any\b\|as any\|any\s*[,\)]" src/app/api/session src/app/api/refresh src/middleware.ts

# Se procurar em toda pasta src:
grep -r ": any\b\|as any\|any\s*[,\)]" src --include="*.ts" --include="*.tsx" | wc -l
```

**Resultado esperado**: 0 ocorrências em arquivo novo/modificado

**Se encontrar `any`**:

```bash
# Mostrar contexto
grep -B2 -A2 "as any\|: any" src/file/exemplo.ts

# Corrigir usando uma destas estratégias:
# 1. unknown + type guard (catch blocks)
# 2. Tipo explícito (parâmetros/return)
# 3. Interface/Type (objetos)
# 4. generic <T> (arrays/generics)
```

### PASSO 3: Validar Imports/Exports (2 min)

```bash
# TypeScript já valida isso no Passo 1
# Mas você pode ser extra-cuidadoso verificando:

# 1. Procurar imports não utilizados (opcional)
# 2. Procurar exports que não existem

# Se pnpm type-check passou, imports/exports estão OK
```

**Resultado esperado**: Nenhum erro de "Cannot find module"

### PASSO 4: Verificar Compilação (5 min)

```bash
# Build Next.js (sem Netlify wrapper, apenas Next)
pnpm run build:next 2>&1

# ✅ Se passar: código pronto
# ❌ Se falhar: corrigir antes de continuar
```

**Resultado esperado**:

```
> next build
...
✓ Compiled successfully
```

### PASSO 5: Atualizar Documentação (3 min)

**Arquivo**: [FASES_2_3_4_ROTEIRO.md](FASES_2_3_4_ROTEIRO.md)

Para cada fase concluída:

1. Adicione seção `## ✅ FASE X: [NOME] (CONCLUÍDA - DD/MM/YYYY)`
2. Liste o que foi feito
3. Liste arquivos modificados
4. Adicione status de validação
5. Atualizar "Próximo passo"

**Template**:

```markdown
## ✅ FASE X: [NOME] (CONCLUÍDA - DD/MM/YYYY)

**Duração real**: X dias
**Status**: ✅ 100% Completo

### O que foi feito:

- ✅ Item 1
- ✅ Item 2

### Arquivos criados/modificados:

1. [arquivo1.ts](arquivo1.ts) - breve descrição
2. [arquivo2.ts](arquivo2.ts) - breve descrição

### Validações executadas:

- ✅ pnpm type-check: PASSOU
- ✅ Procura `any`: 0 ocorrências
- ✅ Build: SEM ERROS

### ⏭️ Próximo passo:

[Descrição do próximo passo]
```

### PASSO 6: Criar Relatório de Status (3 min)

**Arquivo**: Criar `RELATORIO_CHECAGEM_FASE_X.md`

Use este template:

```markdown
# 📋 RELATÓRIO DE CHECAGEM - FASE X

**Data**: DD de Mês de 2024
**Fase**: X - [Nome]
**Status**: ✅ APROVADO PARA PRODUÇÃO

## Validações

| Validação            | Status        |
| -------------------- | ------------- |
| TypeScript           | ✅ PASSOU     |
| Erros compilação     | ✅ 0          |
| Avisos               | ✅ 0          |
| `any` em código novo | ✅ 0          |
| Build Next.js        | ✅ PASSOU     |
| Documentação         | ✅ Atualizada |

## Arquivos Afetados

- [ ] arquivo1.ts
- [ ] arquivo2.ts

## Conclusão

✅ Pronto para QA testing

## Próximo Passo

[Descrição]
```

---

## 🔧 FERRAMENTAS ÚTEIS

### Se encontrou erro de tipo, procure assim:

```bash
# 1. Mostrar erro completo com linha
pnpm type-check 2>&1 | grep "error TS" | head -10

# 2. Abrir arquivo com erro
code src/path/arquivo.ts

# 3. Ir para linha do erro (Ctrl+G)

# 4. Corrigir usando:
#    - Adicionar tipo explícito
#    - Adicionar interface
#    - Usar type guard
#    - Importar tipo correto
```

### Se encontrou `any` não esperado:

```bash
# 1. Encontrar linha exata
grep -n "as any\|: any" src/arquivo.ts

# 2. Ver contexto
sed -n '85,95p' src/arquivo.ts

# 3. Escolher estratégia:
#    ✅ unknown + type guard (melhor)
#    ✅ Tipo específico (bom)
#    ✅ Interface (muito bom)
#    ✅ Generic <T> (melhor ainda)
```

### Se build falhou:

```bash
# 1. Ver erro completo
pnpm run build:next 2>&1 | tail -50

# 2. Procurar arquivo do erro
cat src/path/arquivo.ts

# 3. Verificar importação está correta
grep "import.*from" src/path/arquivo.ts

# 4. Se erro é em .next/, fazer clean
rm -rf .next
pnpm run build:next
```

---

## 📋 TABELA DE DECISÃO

Quando encontrar `any`:

| Situação                 | Solução                     | Exemplo                                                   |
| ------------------------ | --------------------------- | --------------------------------------------------------- |
| Parâmetro desconhecido   | Usar `unknown` + type guard | `(error: unknown) => { if (error instanceof Error) ... }` |
| Tipo de objeto           | Criar Interface             | `interface User { id: string; name: string }`             |
| Tipo de array            | Array<T> ou T[]             | `function map<T>(items: T[]): T[] { ... }`                |
| Return type desconhecido | Generic ou Union            | `function get<T>(): T \| null`                            |
| Firebase/third-party     | Type assertion cuidadoso    | `const user = doc.data() as FirebaseUser \| null`         |

---

## ⚠️ REGRAS IMPORTANTES

### ✅ SEMPRE FAÇA

- ✅ Rodar `pnpm type-check` antes de commitar
- ✅ Procurar `any` em código novo
- ✅ Atualizar documentação após fase
- ✅ Criar relatório de status
- ✅ Só fazer merge após este protocolo

### ❌ NUNCA FAÇA

- ❌ Commitar com erros de tipo
- ❌ Deixar `any` sem tentar corrigir
- ❌ Fazer merge sem validação completa
- ❌ Atualizar documentação depois (faça durante)
- ❌ Ignorar warnings do TypeScript

---

## 🎯 FLUXO RESUMIDO

```
1. Implementar feature/fase
           ↓
2. Rodar pnpm type-check → ✅ ou ❌?
   ❌ → Corrigir, voltar a 2
           ↓
3. Procurar `any` → ✅ ou ❌?
   ❌ → Corrigir, voltar a 3
           ↓
4. Atualizar documentação
           ↓
5. Criar relatório de status
           ↓
6. Pronto para QA/Staging
           ↓
7. Após validação → Deploy
```

---

## 📞 SE TIVER DÚVIDA

| Dúvida                            | Resposta                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| "Posso deixar `any` aqui?"        | ❌ Não. Use `unknown` ou tipo específico.                    |
| "Posso fazer merge com warning?"  | ❌ Não. Warnings são futuros erros.                          |
| "Preciso atualizar documentação?" | ✅ Sim, sempre.                                              |
| "Quanto tempo leva?"              | ~15-20 min por fase                                          |
| "Onde procuro se tiver erro?"     | 1. type-check output, 2. arquivo indicado, 3. linha indicada |

---

## 📊 MÉTRICAS DE SUCESSO

Após completar protocolo, você deve ter:

| Métrica               | ✅ Esperado   |
| --------------------- | ------------- |
| `pnpm type-check`     | exit code 0   |
| Erros TypeScript      | 0             |
| Warnings              | 0             |
| `any` em novo código  | 0             |
| `pnpm run build:next` | Build sucesso |
| Documentação          | Atualizada    |
| Relatório             | Criado        |

---

## 🎓 LIÇÕES

- **Type-safety primeiro**: Código type-safe é mais maintível
- **`any` é inimigo**: Sempre procure alternativa melhor
- **Documentação é importante**: Futuros devs (inclusive você) vão agradecer
- **Validação salva tempo**: 15 min agora vs horas de debug depois
- **Protocolo é seu amigo**: Automatiza processo, reduz risco

---

## 🔗 REFERÊNCIAS RÁPIDAS

- [RELATORIO_CHECAGEM_COMPLETA.md](RELATORIO_CHECAGEM_COMPLETA.md) - Exemplo de relatório
- [FASES_2_3_4_ROTEIRO.md](FASES_2_3_4_ROTEIRO.md) - Documentação de fases
- [GUIA_RAPIDO_REFERENCIA.md](GUIA_RAPIDO_REFERENCIA.md) - Quick reference TypeScript

---

**Protocolo versão**: 1.0  
**Data**: 22 de Dezembro de 2024  
**Responsável**: Copilot + User  
**Status**: ATIVO
