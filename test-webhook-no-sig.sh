#!/bin/bash

# 🧪 TESTE DE WEBHOOK - SEM ASSINATURA

WEBHOOK_URL="https://mygest.netlify.app/api/integrations/whatsapp/webhook"
PHONE="+5541984093321"
TIMESTAMP=$(date -u +%s)000

# ========================================
# CORES
# ========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# ========================================
# Criar payload
# ========================================

PAYLOAD=$(cat <<EOF
{
  "event": "message",
  "data": {
    "id": "msg-test-$(date +%s)",
    "from": "$PHONE",
    "to": null,
    "text": "🧪 Teste SEM assinatura - $(date '+%Y-%m-%d %H:%M:%S')",
    "name": "Teste Script",
    "timestamp": $TIMESTAMP,
    "type": "text"
  }
}
EOF
)

echo -e "${BLUE}📤 Enviando para: $WEBHOOK_URL${NC}"
echo -e "${BLUE}ℹ️  SEM assinatura (apenas Content-Type)${NC}\n"

# ========================================
# Enviar SEM assinatura
# ========================================

RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo -e "${BLUE}Status HTTP: ${HTTP_CODE}${NC}"
echo -e "${BLUE}Response:${NC}"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "\n${GREEN}✅ FUNCIONA! Webhook aceitou sem assinatura!${NC}"
else
  echo -e "\n${RED}❌ Ainda com erro HTTP $HTTP_CODE${NC}"
fi
