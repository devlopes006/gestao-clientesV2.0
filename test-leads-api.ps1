# Test /api/leads endpoint
$env:WEBHOOK_SECRET = "test-secret-key"
$payload = '{"name":"João Silva Teste","phone":"11987654321","email":"joao@teste.com","plan":"premium","bestTime":"Manhã (9h-12h)","utmParams":{"utm_source":"facebook","utm_medium":"cpc"},"origin":"landing_page_test"}'

$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($env:WEBHOOK_SECRET)
$hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))
$signature = [BitConverter]::ToString($hash).Replace("-", "").ToLower()

Write-Host "Testando /api/leads com HMAC..." -ForegroundColor Cyan
Write-Host "Signature: sha256=$signature" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/leads" `
        -Headers @{
            "Content-Type" = "application/json"
            "X-Webhook-Signature" = "sha256=$signature"
        } `
        -Body $payload
    
    Write-Host "`n✅ Sucesso!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "`n❌ Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 3 | Write-Host
    }
}
