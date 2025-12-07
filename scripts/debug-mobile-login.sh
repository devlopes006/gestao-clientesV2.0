#!/bin/bash

# 🔧 Mobile Login Diagnostic Script
# Este script ajuda a diagnosticar problemas de login em mobile

set -e

echo "🔍 Mobile Login Diagnostic"
echo "========================="
echo ""

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado"
    echo "Execute este script da raiz do projeto"
    exit 1
fi

echo "✅ Projeto encontrado"
echo ""

# Check Node version
NODE_VERSION=$(node --version)
echo "📌 Node version: $NODE_VERSION"

# Check if npm scripts exist
if ! grep -q '"dev"' package.json; then
    echo "❌ Script 'dev' não encontrado em package.json"
    exit 1
fi

echo "✅ Scripts do projeto OK"
echo ""

# Create or update .env.local with debug flag
echo "🔧 Configurando DEBUG_AUTH..."

if [ ! -f ".env.local" ]; then
    echo "NEXT_PUBLIC_DEBUG_AUTH=true" > .env.local
    echo "✅ Arquivo .env.local criado com NEXT_PUBLIC_DEBUG_AUTH=true"
else
    if grep -q "NEXT_PUBLIC_DEBUG_AUTH" .env.local; then
        sed -i 's/NEXT_PUBLIC_DEBUG_AUTH=.*/NEXT_PUBLIC_DEBUG_AUTH=true/' .env.local
        echo "✅ NEXT_PUBLIC_DEBUG_AUTH atualizado para true"
    else
        echo "NEXT_PUBLIC_DEBUG_AUTH=true" >> .env.local
        echo "✅ NEXT_PUBLIC_DEBUG_AUTH adicionado a .env.local"
    fi
fi

echo ""
echo "📋 Próximos passos:"
echo ""
echo "1️⃣  Inicie o servidor em desenvolvimento:"
echo "   npm run dev"
echo ""
echo "2️⃣  Abra em desktop: http://localhost:3000/login"
echo ""
echo "3️⃣  No seu celular (mesma rede Wi-Fi):"
echo "   - Encontre o IP do desktop: ipconfig getifaddr en0 (Mac) ou ipconfig (Windows)"
echo "   - Abra no celular: http://[SEU_IP]:3000/login"
echo ""
echo "4️⃣  Execute login e observe:"
echo "   - Badge no canto inferior direito (mostra estado do login)"
echo "   - Console do browser (F12 → Console)"
echo "   - Logs com [DEBUG]"
echo ""
echo "5️⃣  Se falhar, execute no console do celular:"
echo ""
echo "   fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)"
echo ""
echo "   fetch('/api/session').then(r => r.json()).then(console.log)"
echo ""
echo "   document.cookie"
echo ""
echo "6️⃣  Compartilhe:"
echo "   - Screenshot do badge"
echo "   - Logs do console"
echo "   - Resultados dos comandos acima"
echo ""
echo "✨ Script concluído! Boa sorte com o debug!"
