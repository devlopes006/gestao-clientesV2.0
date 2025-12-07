#!/bin/bash

# Script para ativar debug de autenticação em mobile
# Use: npm run debug:auth

echo "🔍 Ativando debug de autenticação..."
echo "NEXT_PUBLIC_DEBUG_AUTH=true" >> .env.local

echo "✅ Debug ativado!"
echo ""
echo "📱 Acesse o app em modo desenvolvimento:"
echo "  npm run dev"
echo ""
echo "Abra DevTools (F12) e veja os logs no console"
echo "Você verá informações detalhadas sobre:"
echo "  - Detecção de dispositivo mobile"
echo "  - Fluxo de redirect"
echo "  - Estado de tokens e sessões"
echo "  - Erros específicos"
