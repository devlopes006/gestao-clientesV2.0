# Auditoria automática — Resumo e próximos passos

Data: 2025-12-03

Resumo das ações automáticas realizadas:

- Encontrado e fixado possível conflito de `import-in-the-middle` (package.json já pinna para `1.15.0`).
- Identificado root-cause: middleware estava interceptando assets e redirecionando para `/login`. Corrigido:
  - `middleware.ts` matcher reduzido para não incluir `'/'` genérico.
  - `src/proxy.ts` acrescentado bypass explícito para `/_next/*`, `/static/*`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/assets/*`.
- Adicionado painel de diagnóstico em runtime (`src/components/RuntimeDiagnostics.tsx`) para ajudar debugging E foi gateado para NÃO rodar em produção (agora retorna `null` quando `NODE_ENV==='production'`), ativável com `NEXT_PUBLIC_RUNTIME_DIAGS=true`.
- Refatorações de diagnóstico para evitar leituras do DOM durante SSR (uso de `useEffect` e render nulo até montagem).
- Inspecionado `src/app/api/session/route.ts` e `src/context/UserContext.tsx` — fluxo de criação de sessão via `/api/session` parece correto (set-Cookie httpOnly), mas necessita validação em runtime (Network).

Checks extra automáticos feitos:

- Buscas no código por `rel="preload"`, `as="font"`, `@font-face`, `woff2`: nenhuma injeção dinâmica problemática encontrada no código do `src/` além do painel de diagnósticos.
- Buscas por `import-in-the-middle` retornaram apenas referências em `pnpm-lock.yaml` e `package.json` (já alinhadas para 1.15.0).

Problemas ainda em aberto (o que testar / corrigir manualmente):

- Algumas folhas de estilo ainda não são carregadas para o usuário. Possíveis causas a verificar em runtime:
  - O servidor está respondendo `200` com HTML para requisições que deveriam retornar CSS/JS (verificar usando DevTools Network ou `curl -I`).
  - Cookies de sessão (`auth`) não sendo aplicadas devido a domínio/secure/sameSite — especialmente em ambientes com proxy reverso ou diferença entre `localhost` e `127.0.0.1`.
  - CSP pode bloquear carregamento de fontes/estilos em produção (verificar header `Content-Security-Policy`).

Passos recomendados (automatizáveis, instruções):

1. Reproduzir a falha localmente com DevTools Network aberto e inspecionar a requisição de cada asset que não carrega. Verificar `Status`, `Content-Type` e `Set-Cookie` (para `/api/session`).

- Exemplo de comando curl para checar Content-Type de um asset:

```bash
curl -I http://localhost:3000/_next/static/chunks/xxxx.css
```

- Para checar se `/api/session` retorna `Set-Cookie`:

```bash
curl -i -X POST http://localhost:3000/api/session -H 'Content-Type: application/json' -d '{"idToken":"<ID_TOKEN>"}'
```

2. Testar fluxo de login completo (desktop e mobile) e inspecionar o pedido POST para `/api/session` e resposta. Conferir que `Set-Cookie: auth=...; HttpOnly` aparece no header da resposta.

3. Se `Set-Cookie` estiver presente mas cookie não sendo guardado, verificar:

- Se `secure` está `true` em ambiente não-HTTPS (deve ser false em dev). O código já define `secure: isProduction`.
- Se há mismatch de domínio (ex.: `APP_URL`/`NEXT_PUBLIC_APP_URL`) afetando CORS/Cookies.
- Se proxy reverso (nginx) está removendo headers `Set-Cookie`.

4. Caso estilos continuem faltando e a requisição do asset volte HTML, verificar logs do middleware e reverso para endpoints que retornem redirecionamento para `/login` (a lógica de `proxy`/`guardAccess` cobre asset bypass, mas podem existir casos fora do matcher atual).

5. Opcional: Habilitar `NEXT_PUBLIC_RUNTIME_DIAGS=true` para forçar o painel de diagnóstico em produção temporariamente (cuidado com dados sensíveis em ambiente público).

Próximas tarefas que posso executar automaticamente (confirme se quer que eu execute):

- Rodar buscas adicionais em `node_modules` para identificar qual pacote traz `import-in-the-middle` (deploy heavy) — já verificado parcialmente.
- Inserir logs temporários em `UserContext` e `session/route.ts` para capturar erros específicos de login em runtime (apenas se autorizar).
- Gerar script `scripts/check-asset-headers.sh` que varre uma lista de assets críticos e reporta status/Content-Type automaticamente.
- Executar um conjunto de `curl`/`fetch` checks apontando para `http://localhost:3000` e salvar um pequeno diagnóstico `logs/asset-check.json`.

Se quiser que eu continue automaticamente, responda com: `sim` e qual das ações acima prefere (ou `tudo` para rodar todas). Se preferir, diga `parar` para interromper ações automáticas.
