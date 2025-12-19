#!/bin/bash

# 🧪 TESTE DE WEBHOOK - PRODUÇÃO
# Script para testar se o webhook está recebendo mensagens corretamente

set -e

# ========================================
# CONFIGURAÇÃO
# ========================================

WEBHOOK_URL="https://mygest.netlify.app/api/integrations/whatsapp/webhook"
SECRET="gestao-clientes-webhook-secret-2025"
PHONE="+5541984093321"
TIMESTAMP=$(date -u +%s)000

# ========================================
# CORES PARA OUTPUT
# ========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# FUNÇÕES
# ========================================

print_header() {
  echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}  $1"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_info() {
  echo -e "${BLUE}ℹ${NC}  $1"
}

print_success() {
  echo -e "${GREEN}✅${NC} $1"
}

print_error() {
  echo -e "${RED}❌${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠️${NC}  $1"
}

# ========================================
# TESTE 1: Verificar Conectividade
# ========================================

print_header "TESTE 1: Conectividade"

print_info "Testando se o webhook está acessível..."
print_info "URL: $WEBHOOK_URL"

if curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" > /dev/null 2>&1; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" 2>/dev/null)
  if [ "$STATUS" == "405" ]; then
    print_success "Webhook está acessível (HTTP $STATUS - GET não permitido, é esperado)"
  elif [ "$STATUS" == "401" ]; then
    print_warning "Webhook respondeu com erro 401 (Unauthorized)"
    print_info "Pode ser por falta de assinatura correta"
  else
    print_success "Webhook acessível (HTTP $STATUS)"
  fi
else
  print_error "Não conseguiu conectar ao webhook!"
  print_error "Verifique:"
  print_error "  1. A URL está correta?"
  print_error "  2. O site está online em Netlify?"
  print_error "  3. Há problema de firewall/bloqueio?"
  exit 1
fi

# ========================================
# TESTE 2: Enviar Mensagem de Teste
# ========================================

print_header "TESTE 2: Enviar Mensagem de Teste"

# Criar payload
PAYLOAD=$(cat <<EOF
{
  "event": "message",
  "data": {
    "id": "msg-test-$(date +%s)",
    "from": "$PHONE",
    "to": null,
    "text": "🧪 Teste de webhook - $(date '+%Y-%m-%d %H:%M:%S')",
    "name": "Teste Script",
    "timestamp": $TIMESTAMP,
    "type": "text"
  }
}
EOF
)

print_info "Payload:"
echo "$PAYLOAD" | jq . 2>/dev/null || echo "$PAYLOAD"

# Calcular assinatura HMAC
print_info "Calculando assinatura HMAC SHA256..."

if command -v openssl &> /dev/null; then
  SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.* //')
  print_success "Assinatura gerada: ${SIGNATURE:0:16}..."
else
  print_warning "OpenSSL não encontrado, enviando sem assinatura"
  SIGNATURE=""
fi

# Enviar requisição
print_info "Enviando requisição POST..."

if [ -z "$SIGNATURE" ]; then
  RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    -w "\n%{http_code}")
else
  RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "X-Signature: $SIGNATURE" \
    -d "$PAYLOAD" \
    -w "\n%{http_code}")
fi

# Processar resposta
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

print_info "HTTP Status: $HTTP_CODE"
print_info "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

# ========================================
# TESTE 3: Validar Resposta
# ========================================

print_header "TESTE 3: Validar Resposta"

if [ "$HTTP_CODE" == "200" ]; then
  print_success "Webhook retornou HTTP 200 ✅"
  
  if echo "$BODY" | grep -q "received"; then
    print_success "Resposta contém 'received' ✅"
  fi
else
  if [ "$HTTP_CODE" == "401" ]; then
    print_error "HTTP 401 - Assinatura inválida ou secret diferente"
    print_info "Verifique:"
    print_info "  1. WHATSAPP_WEBHOOK_SECRET em Netlify"
    print_info "  2. Valor deve ser: gestao-clientes-webhook-secret-2025"
  elif [ "$HTTP_CODE" == "404" ]; then
    print_error "HTTP 404 - Endpoint não encontrado"
    print_info "Verifique a URL: $WEBHOOK_URL"
  elif [ "$HTTP_CODE" == "500" ]; then
    print_error "HTTP 500 - Erro no servidor"
    print_info "Verifique os logs da Netlify"
  else
    print_error "HTTP $HTTP_CODE - Erro desconhecido"
  fi
fi

# ========================================
# RESUMO
# ========================================

print_header "RESUMO"

print_info "Webhook URL: $WEBHOOK_URL"
print_info "Status: HTTP $HTTP_CODE"

if [ "$HTTP_CODE" == "200" ]; then
  print_success "WEBHOOK ESTÁ FUNCIONANDO! 🎉"
  print_info ""
  print_info "Próximos passos:"
  print_info "  1. Envie uma mensagem real no WhatsApp"
  print_info "  2. Acesse https://mygest.netlify.app/messages"
  print_info "  3. A mensagem deve aparecer lá"
else
  print_error "WEBHOOK COM PROBLEMA"
  print_info ""
  print_info "Debugar:"
  print_info "  1. Netlify → mygest → Deployments → Deploy log"
  print_info "  2. Procure por: [WhatsApp Webhook]"
  print_info "  3. Verifique as variáveis de ambiente"
fi

echo ""
