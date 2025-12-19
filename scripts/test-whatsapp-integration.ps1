# Script de Teste - Integração WhatsApp
# Testa o fluxo completo: Webhook → Criação de Lead → Visualização de Mensagens

Write-Host "🚀 Teste de Integração WhatsApp" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se o servidor está rodando
Write-Host "1️⃣ Verificando servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -ErrorAction Stop
    Write-Host "✅ Servidor rodando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor não está rodando. Execute: pnpm dev" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Testar endpoint de webhook
Write-Host "2️⃣ Testando webhook com nova mensagem..." -ForegroundColor Yellow

$testPhone = "+5541999887766"
$testName = "Cliente Teste WhatsApp"
$testMessage = "Olá, vim da landing page!"

$webhookPayload = @{
    event = "message"
    messageId = "msg_$(Get-Random -Minimum 10000 -Maximum 99999)"
    from = $testPhone
    name = $testName
    type = "text"
    text = $testMessage
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

Write-Host "📤 Enviando: $testMessage" -ForegroundColor Gray
Write-Host "📱 De: $testName ($testPhone)" -ForegroundColor Gray

try {
    $webhookResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/integrations/whatsapp/webhook" `
        -Method POST `
        -ContentType "application/json" `
        -Body $webhookPayload

    Write-Host "✅ Webhook recebido!" -ForegroundColor Green
    Write-Host "Response: $($webhookResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro no webhook: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}

Write-Host ""

# 3. Verificar se o lead foi criado
Write-Host "3️⃣ Verificando criação de lead..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $messagesResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/integrations/whatsapp/messages?limit=10" `
        -Method GET

    $lastMessage = $messagesResponse.messages | Where-Object { $_.from -eq $testPhone } | Select-Object -First 1

    if ($lastMessage) {
        Write-Host "✅ Mensagem encontrada no banco!" -ForegroundColor Green
        Write-Host "ID da Mensagem: $($lastMessage.id)" -ForegroundColor Gray
        Write-Host "Texto: $($lastMessage.text)" -ForegroundColor Gray
        
        if ($lastMessage.client) {
            Write-Host "✅ Lead criado automaticamente!" -ForegroundColor Green
            Write-Host "Cliente ID: $($lastMessage.client.id)" -ForegroundColor Gray
            Write-Host "Nome: $($lastMessage.client.name)" -ForegroundColor Gray
            Write-Host "Email: $($lastMessage.client.email)" -ForegroundColor Gray
        } else {
            Write-Host "⚠️ Lead não foi associado" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Mensagem não encontrada no banco" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao buscar mensagens: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Instruções para teste manual
Write-Host "4️⃣ Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Abra http://localhost:3000/messages no navegador" -ForegroundColor White
Write-Host "2. Você deve ver a conversa com $testName" -ForegroundColor White
Write-Host "3. Clique na conversa para visualizar a mensagem" -ForegroundColor White
Write-Host "4. Teste enviar uma resposta (opcional)" -ForegroundColor White

Write-Host ""
Write-Host "✨ Teste concluído!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Notas:" -ForegroundColor Gray
Write-Host "- Para testar com a landing page real, configure WHATSAPP_WEBHOOK_SECRET no .env.local" -ForegroundColor Gray
Write-Host "- Para producao, adicione a mesma secret nas variaveis de ambiente da Vercel" -ForegroundColor Gray
