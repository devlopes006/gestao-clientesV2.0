# Script de Setup da Integração WhatsApp
# Execute no diretório raiz do projeto gestao-clientesV2.0

Write-Host "🚀 Setup da Integração WhatsApp - Landing Page" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
pnpm install

Write-Host ""
Write-Host "🔧 Gerando Prisma Client..." -ForegroundColor Yellow
pnpm prisma:generate

Write-Host ""
Write-Host "📊 Aplicando migração do banco de dados..." -ForegroundColor Yellow
$migrationName = "add-whatsapp-messages"
pnpm prisma migrate dev --name $migrationName

Write-Host ""
Write-Host "🔐 Configurando variáveis de ambiente..." -ForegroundColor Yellow

# Gerar uma chave secreta aleatória se necessário
function Generate-Secret {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Arquivo .env.local não encontrado. Criando..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
}

# Ler conteúdo do .env.local
$envContent = Get-Content ".env.local" -Raw

# Verificar se as variáveis já existem
if ($envContent -notmatch "WHATSAPP_WEBHOOK_SECRET=") {
    Write-Host "➕ Adicionando WHATSAPP_WEBHOOK_SECRET..." -ForegroundColor Green
    $secret = Generate-Secret
    $envContent += "`n`n# WhatsApp Webhook Integration`nWHATSAPP_WEBHOOK_SECRET=`"$secret`"`n"
    Write-Host "   Chave gerada: $secret" -ForegroundColor Gray
} else {
    Write-Host "✓ WHATSAPP_WEBHOOK_SECRET já existe" -ForegroundColor Green
}

if ($envContent -notmatch "NEXT_PUBLIC_MESSAGES_GATEWAY=") {
    Write-Host "➕ Adicionando NEXT_PUBLIC_MESSAGES_GATEWAY..." -ForegroundColor Green
    $envContent += "NEXT_PUBLIC_MESSAGES_GATEWAY=`"https://lp-conversaoextrema-esther.vercel.app`"`n"
} else {
    Write-Host "✓ NEXT_PUBLIC_MESSAGES_GATEWAY já existe" -ForegroundColor Green
}

# Salvar .env.local
Set-Content ".env.local" $envContent

Write-Host ""
Write-Host "✅ Setup concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure a Landing Page (Vercel):" -ForegroundColor White
Write-Host "   GESTAO_CLIENTES_WEBHOOK_URL=https://SEU-APP/api/integrations/whatsapp/webhook" -ForegroundColor Gray
Write-Host "   GESTAO_CLIENTES_WEBHOOK_SECRET=<mesma_chave_do_WHATSAPP_WEBHOOK_SECRET>" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Inicie o servidor de desenvolvimento:" -ForegroundColor White
Write-Host "   pnpm dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Acesse o painel de mensagens:" -ForegroundColor White
Write-Host "   http://localhost:3000/messages" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Teste o webhook:" -ForegroundColor White
Write-Host "   Ver exemplos em docs/WHATSAPP_LP_INTEGRATION.md" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Documentação completa: docs/WHATSAPP_LP_INTEGRATION.md" -ForegroundColor Cyan
Write-Host ""

# Perguntar se deseja abrir a documentação
$openDocs = Read-Host "Deseja abrir a documentação agora? (S/N)"
if ($openDocs -eq "S" -or $openDocs -eq "s") {
    Start-Process "docs\WHATSAPP_LP_INTEGRATION.md"
}

# Perguntar se deseja iniciar o dev server
$startDev = Read-Host "Deseja iniciar o servidor de desenvolvimento? (S/N)"
if ($startDev -eq "S" -or $startDev -eq "s") {
    pnpm dev
}
