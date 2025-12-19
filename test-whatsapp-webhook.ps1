# Script de Teste do Webhook WhatsApp
# Testa o endpoint localmente com mensagem de exemplo

param(
    [string]$Url = "http://localhost:3000/api/integrations/whatsapp/webhook",
    [string]$Secret = ""
)

Write-Host "🧪 Teste do Webhook WhatsApp" -ForegroundColor Cyan
Write-Host ""

# Carregar secret do .env.local se não fornecido
if ([string]::IsNullOrEmpty($Secret)) {
    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local"
        foreach ($line in $envContent) {
            if ($line -match 'WHATSAPP_WEBHOOK_SECRET="?([^"]+)"?') {
                $Secret = $matches[1]
                break
            }
        }
    }
}

if ([string]::IsNullOrEmpty($Secret)) {
    Write-Host "⚠️  WHATSAPP_WEBHOOK_SECRET não encontrado em .env.local" -ForegroundColor Yellow
    Write-Host "   Continuando sem validação HMAC..." -ForegroundColor Gray
    Write-Host ""
}

# Payload de teste
$payload = @{
    event = "message"
    data = @{
        id = "test-" + [guid]::NewGuid().ToString()
        from = "5541999998888"
        to = $null
        name = "Cliente Teste"
        type = "text"
        text = "Olá! Esta é uma mensagem de teste do formulário da landing page."
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 Enviando payload:" -ForegroundColor Yellow
Write-Host $payload -ForegroundColor Gray
Write-Host ""

# Calcular HMAC se secret estiver disponível
$headers = @{
    "Content-Type" = "application/json"
}

if (-not [string]::IsNullOrEmpty($Secret)) {
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
    $hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))
    $signature = [BitConverter]::ToString($hash).Replace("-", "").ToLower()
    $headers["X-Signature"] = $signature
    
    Write-Host "🔐 HMAC calculado: $signature" -ForegroundColor Green
    Write-Host ""
}

# Enviar requisição
try {
    Write-Host "🚀 Enviando para: $Url" -ForegroundColor Cyan
    
    $response = Invoke-WebRequest -Uri $Url `
        -Method POST `
        -Headers $headers `
        -Body $payload `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✅ Sucesso! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📥 Resposta:" -ForegroundColor Yellow
    Write-Host $response.Content -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "🎉 Webhook funcionando corretamente!" -ForegroundColor Green
    Write-Host "   Verifique os logs do servidor e o banco de dados." -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao chamar webhook:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host ""
            Write-Host "💡 Dica: Erro 401 indica assinatura HMAC inválida." -ForegroundColor Yellow
            Write-Host "   Verifique se WHATSAPP_WEBHOOK_SECRET está correto em ambos os lados." -ForegroundColor Yellow
        }
    }
    
    exit 1
}

Write-Host ""
Write-Host "📊 Para verificar no banco de dados:" -ForegroundColor Cyan
Write-Host "   pnpm prisma studio" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Para ver no painel:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/messages" -ForegroundColor Gray
Write-Host ""
