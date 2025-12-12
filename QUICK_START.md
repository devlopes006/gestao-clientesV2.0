# 🚀 Quick Start - Dashboard Funcional

**Tempo estimado de leitura:** 5 minutos  
**Tempo estimado para testar:** 10 minutos

---

## ⚡ Quick Start em 3 Passos

### 1️⃣ Iniciar o servidor

```bash
cd c:/Users/devel/projetos/gestao-clientes
pnpm dev
```

Aguarde até ver:

```
  ▲ Next.js 16 ready in 2.3s
  → Local: http://localhost:3000
```

### 2️⃣ Abrir no navegador

```
http://localhost:3000/dashboard
```

Login se necessário

### 3️⃣ Descer na página e procurar por:

```
📅 CALENDÁRIO FUNCIONAL        📝 NOTAS RÁPIDAS
```

Pronto! 🎉

---

## 🎯 5 Testes Rápidos

### ✅ Teste 1: Criar Evento

1. Clique em um dia do calendário
2. Preencha: Título = "Teste"
3. Cor = Azul
4. Clique "Criar Evento"

**Esperado:** Event aparece na badge azul no calendário

---

### ✅ Teste 2: Criar Nota

1. Clique "Nova Nota"
2. Conteúdo = "Minha primeira nota"
3. Cor = Amarelo
4. Clique "Criar Nota"

**Esperado:** Nota aparece no grid

---

### ✅ Teste 3: Deletar Evento

1. Clique no dia com o evento
2. Clique no 🗑️
3. Confirme

**Esperado:** Evento desaparece

---

### ✅ Teste 4: Drag-Drop Nota

1. Clique e arraste uma nota
2. Solte em outro lugar

**Esperado:** Nota muda de posição

---

### ✅ Teste 5: Persistência

1. Feche a aba (ou refresh F5)
2. Reabra o dashboard

**Esperado:** Eventos/notas ainda estão lá!

---

## 🎨 Cores Disponíveis

Escolha entre:

- 🔵 Blue (Reuniões)
- 🔴 Red (Urgente)
- 🟢 Green (Completo)
- 🟡 Yellow (Em Progresso)
- 🟣 Purple (Pessoal)
- 🌸 Pink (Ideias)
- 🟠 Orange (Marketing)
- 🔷 Cyan (Tech)

---

## 🔍 Se Algo Não Funcionar

### Erro: "Módulo não encontrado"

```bash
# Solução:
pnpm install
pnpm dev
```

### Notas/Eventos não aparecem

1. Verificar se você está logado
2. Abrir F12 > Console
3. Procurar por erros vermelhos
4. Se persistir, executar:

```bash
pnpm build:next
```

### Performance lenta

```bash
# Limpar cache:
rm -rf .next
pnpm dev
```

---

## 📚 Mais Informações

- **Começar:** [DASHBOARD_FUNCTIONAL_SUMMARY.md](./DASHBOARD_FUNCTIONAL_SUMMARY.md)
- **Testes Completos:** [TESTING_GUIDE_FUNCTIONAL_DASHBOARD.md](./docs/TESTING_GUIDE_FUNCTIONAL_DASHBOARD.md)
- **Técnico:** [docs/DASHBOARD_FUNCTIONAL_COMPONENTS.md](./docs/DASHBOARD_FUNCTIONAL_COMPONENTS.md)
- **Visual:** [DASHBOARD_VISUAL_DEMO.md](./DASHBOARD_VISUAL_DEMO.md)

---

## ✨ Destaques

✅ 100% funcional  
✅ Dados salvos no BD  
✅ Responsivo (mobile-friendly)  
✅ Sem bugs conhecidos  
✅ Production-ready

---

## 🎯 Próximas Melhorias

- Editar evento/nota
- Upload de imagens
- Notificações
- Tags/categorias

---

**Versão:** 1.0.0  
**Status:** ✅ Pronto para usar  
**Build:** ✓ Passou
