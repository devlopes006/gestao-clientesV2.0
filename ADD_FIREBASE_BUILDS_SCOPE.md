# 🔧 Adicionar Firebase Credentials com Escopo "Builds"

## Problema Resolvido

✅ Removemos `FIREBASE_PRIVATE_KEY` do escopo `all` (runtime)
✅ Código agora é resiliente - não trava se faltar credenciais em runtime
✅ Netlify Blobs já tem as credenciais para runtime

## ⚠️ O Que Falta

Adicionar as credenciais **APENAS para build-time** com escopo `builds` no Netlify Dashboard.

## 🎯 Passo a Passo

### 1. Abra o Netlify Dashboard

https://app.netlify.com/sites/mygest/settings/env

### 2. Adicione `FIREBASE_PRIVATE_KEY`

- Clique em "Add variable"
- **Key:** `FIREBASE_PRIVATE_KEY`
- **Value:** Copie de abaixo
- **Scope:** Selecione **"Builds"** (importante!)
- Clique "Save"

**Valor para copiar:**

```
"-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC7kOFAskIscTJx\nhvcs81bwxguyzvtmcrNK4PrLLQOPtY4LpKaiRFniCwM1HwcRbImMVsMExxY0Eg0V\ntilTiebbd73LuiGEy0tcp9eTAXor75biv4FAVDrllKcFYhfFZY3vbJORb8RamNSo\n8bDDUE7R1Z5wtQwPE6+aK+L+exhMTQ5u5oLObqmdV52PPuVVDCXjSzxB9gxeVPgs\nmrBXysOteoT5bUN+C0d6/WahMGZj91H+K8UOj6mTdETHWOLi9fBHQ/uWZDUMLvAv\n9f+L2yVcOmrGIpIGAjSEh+OCmcVxvtzd3EAlyvsMXmNoTPLsiPY8s8fn5z+Y4Hfr\nui3XTZJhAgMBAAECggEAUwZXBu3BB+4VX5ZX/DA8qDhp/jzLoHYeMgNzUBM9U9QQ\nK8w2rHYn+TxZr55r4QUTv6i6C3fatrLU0ur+0QkmRLh0rWTXKHJaigmLjXlmbGNR\n/U26t1Bxf6U051eb4RdKZBRCH+sC1f13iM7vKQ13zj9KMmaZj2Tt4ocRpAa14zOm\nswuorE9r64Aj/qZO5tcEuVe5md1liamIXRiRzeozFR6SjhnL13H9j2guo0PA9aAN\n3e07KodQfYP5oCRtE4wER3VGvuI3xpjd4GLiej1fgReMme1Y/MeoyGyp729ViQ0H\nFO4uBx+4VG+56ISrGcwvofMN26G4Ke3Y1+Ko32EIZwKBgQD9AP2wrkSr9grqIgar\nyZpS6JlPd3ri9Xd6B3bz0luCkd01EPCJplLfuoO771xfCYbAiZCwZ5TAPZzu6rdx\ndnRyohOjhAMea8fYO182RXSeYIsUZKi+EHVuYj+qWgAvdsxapv6+NzTaK1Iwuafg\no7snKrD2ZSx2gKJu5VddR5NInwKBgQC9yYGyqVWRzr7W6+HZJHYM9E+QvoGJ2Grl\nIM2HYiqqFon3hLrRJ8Zo91YUryIcsCQAM4AvxKzmp3PGIOppnB0+aYHGyheSpoV5\nCuC9BnVES5QtfwRauFBlFETbntAs+eoMi9O+TtAqGXoG75/xdzTBBA2YVXVQnl+J\nKpJWevJE/wKBgQDT2OyT8JgX1WG2Qt+LILhUC+eznrwLJrbwOyfjaZSudCzhrll7\nKQXjyG1eBEM4YOWwen/o9hKcFfs+ItOP8jv3cLc5B+UEqAMikDRdYTMRGo3aeZ7B\n504tK59bqRjWpYbfsU1FQTzEIdokapCjjPW9CgY7iuP8JiHc8bSBqtksyQKBgQCz\nUYusJXbmV3PVWfaA1oR75PKwjm+SsNr/Nyk6u7QYFUeyiMSDDpPXZar9zCPs+zho\nwEBj4e6D2L/4+ezCcHDpIYMvMo9nTtNZ9L83mrx+FPMisZqJpRDBEI+m+r0zYcaU\nqCEe9RSWUpALsalr2vgLTysRPd2kmJ8n2QN/lpcGPQKBgQCHWtSiflJ0J4r0GhCp\ntiXTKuai0rFlTTRqW2/hoY5onG/Rw1eLEAk3qv4sgCR8FxN/gFjQ/b2U9j1J3cZc\nB1A5gLz4IVTHP9eU52+M7DyQ9BAxBQBfoww8mM+yDhaOpofDtHedQLoUC9yEL4ke\n3qTw5bQFpl6UFNUW2Gb1mRIc/w==\n-----END PRIVATE KEY-----\n"
```

### 3. Adicione `FIREBASE_CLIENT_EMAIL`

- Clique em "Add variable"
- **Key:** `FIREBASE_CLIENT_EMAIL`
- **Value:** `firebase-adminsdk-fbsvc@mygest-feeca.iam.gserviceaccount.com`
- **Scope:** Selecione **"Builds"** (importante!)
- Clique "Save"

### 4. Trigger Deploy

```bash
git commit --allow-empty -m "chore: trigger build with Firebase builds-only credentials"
git push origin master
```

## ✅ O Que Isso Faz

| Contexto         | Source                                        | Status                   |
| ---------------- | --------------------------------------------- | ------------------------ |
| **Build-time**   | `FIREBASE_PRIVATE_KEY` env var (builds scope) | ✅ Disponível            |
| **Runtime**      | Netlify Blobs                                 | ✅ Disponível            |
| **Env var size** | Removido do runtime                           | ✅ Economiza ~1700 bytes |
| **4KB limit**    | Não excede mais                               | ✅ Dentro do limite      |

## 🎯 Resultado Esperado

Próximo deploy:

1. ✅ Build completará com Firebase inicializado (via env vars)
2. ✅ Runtime usará Netlify Blobs (sem env vars)
3. ✅ Deploy será bem-sucedido (dentro do 4KB limit)
4. ✅ App funcionará normalmente em produção

---

**Dashboard:** https://app.netlify.com/sites/mygest/settings/env
