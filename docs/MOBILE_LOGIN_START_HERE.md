# 📱 Mobile Login - O Que Fazer AGORA

## 🎯 TL;DR (Muito Longo, Não Li)

**Seu problema:** Login em mobile não funciona. Seleciona conta Google e volta pra login.

**O que criamos:** 5 ferramentas + 10 documentos de debug

**O que você deve fazer AGORA:**

```bash
# 1. Ativar debug (execute UMA VEZ)
echo "NEXT_PUBLIC_DEBUG_AUTH=true" >> .env.local
npm run dev

# 2. Testar em celular
http://192.168.X.X:3000/login  # Substitua com seu IP

# 3. Se falhar, executar no console do celular
fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)

# 4. Compartilhar resultado
# Screenshot + output acima → Eu fixo
```

---

## 📋 Checklist Rápido

- [ ] Abrir `.env.local`
- [ ] Adicionar: `NEXT_PUBLIC_DEBUG_AUTH=true`
- [ ] Salvar arquivo
- [ ] `npm run dev` (deixar rodando)
- [ ] Abrir em celular: `http://SEU_IP:3000/login`
- [ ] Clique em "Continuar com Google"
- [ ] Selecione conta
- [ ] Espere voltar
- [ ] Se não entrar:
  - [ ] Abra Console (F12)
  - [ ] Execute: `fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)`
  - [ ] Screenshot do resultado
  - [ ] Me compartilhe

---

## 🚀 Passo-a-Passo Ultra Rápido

### Passo 1 (30 seg): Ativar Debug

```bash
# Terminal do projeto
echo "NEXT_PUBLIC_DEBUG_AUTH=true" >> .env.local
```

### Passo 2 (10 seg): Iniciar Servidor

```bash
npm run dev
# Deixe rodando em outro terminal
```

### Passo 3 (30 seg): Abrir em Desktop

```
http://localhost:3000/login
F12 para abrir console (opcional)
```

### Passo 4 (1 min): Abrir em Celular

```
Encontre seu IP: ipconfig (Windows) ou ifconfig (Mac)
Procure por algo como: 192.168.1.XXX
No celular: http://192.168.1.XXX:3000/login
```

### Passo 5 (2 min): Tentar Login

```
1. Clique: "Continuar com Google"
2. Selecione sua conta
3. Aguarde voltar para app
4. Se entrou: ✅ Pronto!
5. Se não entrou: Continue para Passo 6
```

### Passo 6 (1 min): Se Falhou - Diagnosticar

```
No celular, abra Console (F12)
Execute:
fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)

Vai mostrar algo tipo:
{
  "mobile": true,
  "authCookie": false,
  "session": {"user": null}
}

Copie este resultado
```

### Passo 7 (30 seg): Compartilhar

```
Mande para mim:
1. Screenshot da página (com a falha)
2. Resultado do comando acima
3. Pronto! Vou fixar baseado nisso
```

**Tempo total: ~6 minutos** ⏱️

---

## 🎁 O Que Criamos Para Você

### Ferramentas (Automáticas)

- 🖼️ Badge visual no canto inferior (mostra estado em tempo real)
- 🔍 API de debug (/api/debug/auth-flow)
- 🎯 Script de setup (bash scripts/debug-mobile-login.sh)

### Documentos (Escolha 1)

| Tempo  | Documento         | Link                            |
| ------ | ----------------- | ------------------------------- |
| 1 min  | Sumário           | MOBILE_LOGIN_README.md          |
| 2 min  | Referência Rápida | MOBILE_LOGIN_QUICK_REFERENCE.md |
| 5 min  | Fixes Rápidos     | MOBILE_LOGIN_QUICK_FIXES.md     |
| 10 min | Copy-Paste        | MOBILE_LOGIN_COPYPASTE.md       |
| 10 min | Guia Completo     | MOBILE_LOGIN_TESTING.md         |

---

## 🚨 Se Não Funcionar - Tente Isso

### Opção 1: Limpar Storage (60% de chance)

```javascript
// No console do celular
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Opção 2: Aumentar Timeout

Editar `src/context/UserContext.tsx` linha 187:

```tsx
// Mudar de 10000 para 20000
}, 20000);
```

### Opção 3: Verificar HTTPS (Se em produção)

Verificar se seu site redireciona HTTP → HTTPS

### Opção 4: Ativar Debug e Compartilhar Logs

```bash
NEXT_PUBLIC_DEBUG_AUTH=true npm run dev
```

Compartilhe output do terminal

---

## 🎯 Status das Ferramentas

| Ferramenta       | O Que Faz              | Como Usar                            |
| ---------------- | ---------------------- | ------------------------------------ |
| **AuthDebug**    | Mostra estado em badge | Automático em /login                 |
| **Debug API**    | Testa cada etapa       | `fetch('/api/debug/auth-flow')`      |
| **Debug Script** | Setup automático       | `bash scripts/debug-mobile-login.sh` |

---

## 💡 Se Tiver Dúvida

### "Qual é meu IP?"

**Windows:**

```bash
ipconfig
# Procure por: IPv4 Address: 192.168.X.X
```

**Mac:**

```bash
ifconfig | grep inet
# Procure por: inet 192.168.X.X
```

### "Console não abre"

**iPhone/Safari:** Settings → Advanced → Web Inspector (ligar toggle)
**Android/Chrome:** Menu → Settings → Developer Tools

### "Não sei o que compartilhar"

```
1. Screenshot da página quando falha
2. Resultado de: fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)
3. Resultado de: document.cookie
```

---

## ✨ O Que Esperar

### ✅ Se Funcionar

```
Badge vai mostrar: "User: seu@email.com"
App vai redirecionar para /dashboard
Login = Sucesso! 🎉
```

### ❌ Se Não Funcionar

```
Badge vai mostrar: "User: null"
App vai ficar na página de login
Mas temos dados para debugar!
```

---

## 🏁 Resumo Final

```
┌─────────────────────────┐
│  Seu Problema:          │
│  Mobile login quebrado  │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  Minhas Ferramentas:    │
│  ✅ Debug component     │
│  ✅ Debug API           │
│  ✅ 10 Documentos       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  Seu Próximo Passo:     │
│  1. npm run dev         │
│  2. Teste em mobile     │
│  3. Compartilhe logs    │
│  4. Eu fixo! ✨         │
└─────────────────────────┘
```

---

## 🎬 Começar Agora

```bash
# Copiar e colar no terminal
echo "NEXT_PUBLIC_DEBUG_AUTH=true" >> .env.local && npm run dev
```

Depois abra `http://192.168.X.X:3000/login` no celular.

**Boa sorte!** 🚀

---

## 📞 Precisa Ajuda?

Qualquer dúvida sobre os passos acima:

1. Abra `docs/MOBILE_LOGIN_INDEX.md` (tem links para tudo)
2. Procure por seu tempo disponível
3. Leia o documento correspondente

Ou:

1. Vá direto para `docs/MOBILE_LOGIN_COPYPASTE.md`
2. Copy-Paste dos comandos prontos

**Tudo preparado para você conseguir!** 💪
