#!/bin/bash
# Script simplificado de teste

echo "🧪 TESTE DA INTEGRAÇÃO WHATSAPP"
echo "================================"
echo ""

# Verifica env
echo "1️⃣ Verificando variáveis de ambiente..."
source /c/Users/devel/projetos/gestao-clientes/.env.local 2>/dev/null
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL não está configurado"
else
  echo "✅ DATABASE_URL OK"
fi

if [ -z "$NEXT_PUBLIC_MESSAGES_GATEWAY" ]; then
  echo "⚠️  NEXT_PUBLIC_MESSAGES_GATEWAY não está configurado"
else
  echo "✅ NEXT_PUBLIC_MESSAGES_GATEWAY OK"
fi

echo ""
echo "2️⃣ Aguardando servidor iniciar (5s)..."
sleep 5

echo ""
echo "3️⃣ Testando webhook..."
curl -X POST http://localhost:3001/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "from": "5548991964517",
    "name": "Teste",
    "type": "text",
    "text": "Mensagem de teste",
    "timestamp": "2025-12-19T18:00:00.000Z"
  }' 2>/dev/null | head -10

echo ""
echo "4️⃣ Testando interface..."
curl -s -I http://localhost:3001/messages | head -3

echo ""
echo "✅ Testes concluídos!"
