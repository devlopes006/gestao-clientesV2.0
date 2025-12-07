#!/bin/bash
# Script de validação CSP
# Verifica se CSP está configurado corretamente (fonte única)

set -e

echo "🔍 Validando configuração CSP..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0

# 1. Verificar se CSP existe apenas no middleware
echo "1️⃣ Verificando fonte única de CSP..."

if grep -q "Content-Security-Policy" public/_headers 2>/dev/null; then
    echo -e "${RED}❌ ERRO: CSP encontrado em public/_headers${NC}"
    echo "   Remova o CSP de public/_headers"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ OK: public/_headers sem CSP${NC}"
fi

if grep -q "Content-Security-Policy" next.config.ts 2>/dev/null; then
    echo -e "${RED}❌ ERRO: CSP encontrado em next.config.ts${NC}"
    echo "   Remova o CSP de next.config.ts"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ OK: next.config.ts sem CSP${NC}"
fi

if grep -q "Content-Security-Policy" src/proxy.ts 2>/dev/null; then
    echo -e "${GREEN}✅ OK: CSP encontrado em src/proxy.ts (esperado)${NC}"
else
    echo -e "${RED}❌ ERRO: CSP NÃO encontrado em src/proxy.ts${NC}"
    echo "   Adicione o CSP ao middleware"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 2. Verificar unsafe-inline
echo "2️⃣ Verificando unsafe-inline..."

if grep -q "'unsafe-inline'" src/proxy.ts 2>/dev/null; then
    echo -e "${GREEN}✅ OK: 'unsafe-inline' presente${NC}"
else
    echo -e "${YELLOW}⚠️  AVISO: 'unsafe-inline' não encontrado${NC}"
    echo "   Next.js pode precisar de 'unsafe-inline' para scripts inline"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# 3. Verificar se nonce NÃO está sendo usado
echo "3️⃣ Verificando ausência de nonces..."

if grep -q "nonce-" src/proxy.ts 2>/dev/null; then
    echo -e "${RED}❌ ERRO: Nonce encontrado em src/proxy.ts${NC}"
    echo "   Remova nonces para compatibilidade com Netlify"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ OK: Sem nonces no CSP${NC}"
fi

if grep -q "getNonce" src/app/layout.tsx 2>/dev/null; then
    echo -e "${RED}❌ ERRO: getNonce encontrado em layout.tsx${NC}"
    echo "   Remova chamadas a getNonce"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ OK: layout.tsx sem getNonce${NC}"
fi

echo ""

# 4. Verificar domínios importantes
echo "4️⃣ Verificando domínios de terceiros..."

REQUIRED_DOMAINS=(
    "accounts.google.com"
    "apis.google.com"
    "firebase"
    "posthog.com"
    "sentry.io"
    "r2.cloudflarestorage.com"
)

for domain in "${REQUIRED_DOMAINS[@]}"; do
    if grep -q "$domain" src/proxy.ts 2>/dev/null; then
        echo -e "${GREEN}✅ OK: $domain presente${NC}"
    else
        echo -e "${YELLOW}⚠️  AVISO: $domain não encontrado${NC}"
        echo "   Verifique se este domínio é necessário"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo ""

# 5. Verificar diretivas importantes
echo "5️⃣ Verificando diretivas CSP essenciais..."

REQUIRED_DIRECTIVES=(
    "default-src"
    "script-src"
    "connect-src"
    "style-src"
    "img-src"
    "frame-src"
)

for directive in "${REQUIRED_DIRECTIVES[@]}"; do
    if grep -q "$directive" src/proxy.ts 2>/dev/null; then
        echo -e "${GREEN}✅ OK: $directive presente${NC}"
    else
        echo -e "${RED}❌ ERRO: $directive não encontrada${NC}"
        echo "   Adicione a diretiva $directive ao CSP"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Resumo
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ VALIDAÇÃO COMPLETA: Nenhum problema encontrado!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  VALIDAÇÃO COM AVISOS: $WARNINGS aviso(s)${NC}"
    exit 0
else
    echo -e "${RED}❌ VALIDAÇÃO FALHOU: $ERRORS erro(s), $WARNINGS aviso(s)${NC}"
    echo ""
    echo "Corrija os erros acima antes de fazer deploy"
    exit 1
fi
