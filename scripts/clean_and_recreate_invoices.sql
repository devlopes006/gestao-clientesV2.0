-- Script para limpar todas as faturas e recriar conforme especificado
-- Data: Dezembro 2025

-- PASSO 1: Remover todos os itens de fatura
DELETE FROM "InvoiceItem" WHERE "invoiceId" IN (
  SELECT id FROM "Invoice" WHERE "deletedAt" IS NULL
);

-- PASSO 2: Remover todas as faturas
DELETE FROM "Invoice" WHERE "deletedAt" IS NULL;

-- PASSO 3: Resetar sequência de IDs se necessário (PostgreSQL)
-- ALTER SEQUENCE "Invoice_id_seq" RESTART WITH 1;

-- Após executar este script, use a aplicação para criar as faturas manualmente
-- ou execute o script JavaScript de criação

-- MAPEAMENTO DE CLIENTES (substituir com IDs reais):
-- hudson/ZL Sushi: <client_id>
-- Isabel: <client_id>
-- alexandra: <client_id>
-- fabiana: <client_id>
-- infinix: <client_id>
-- MANU (designer): <client_id>
-- mané: <client_id>
-- ADV ARIANE: <client_id>
-- MANE MINEIRA: <client_id>
-- UNIMARCAS: <client_id>
-- FABI: <client_id>
-- DISTRIBUIDORA: <client_id>

-- DADOS A SEREM CRIADOS:
-- OUTUBRO:
-- ZL Sushi (hudson) - R$ 700,00 - Sem parcelamento
-- Isabel - R$ 1.200,00 - Verificar parcelamento
-- alexandra - R$ 1.200,00 - Verificar parcelamento
-- fabiana - R$ 600,00 - Verificar parcelamento
-- infinix - R$ 1.200,00 - Verificar parcelamento
-- MANU (designer) - R$ 775,00 - Verificar parcelamento
-- mané - R$ 750,00 - Verificar parcelamento

-- NOVEMBRO:
-- ZL Sushi (hudson) - R$ 700,00
-- Isabel - R$ 1.200,00
-- infinix - R$ 1.200,00
-- alexandra - R$ 1.200,00
-- MANE MINEIRA - R$ 0,00 (sem cobrança)
-- ADV ARIANE - R$ 800,00
-- MANU - R$ 600,00
-- UNIMARCAS - R$ 882,00
-- FABI - R$ 1.200,00
-- DISTRIBUIDORA - R$ 50,00
-- Devolução empréstimo Darlon - R$ 100,00 (transação, não fatura)

-- DEZEMBRO:
-- ZL Sushi (hudson) - (sem valor = sem fatura)
-- Isabel - (sem valor = sem fatura)
-- infinix - (sem valor = sem fatura)
-- alexandra - R$ 600,00
-- MANE MINEIRA - R$ 750,00
-- ADV ARIANE - (sem valor = sem fatura)
-- MANU - (sem valor = sem fatura)
-- UNIMARCAS - (sem valor = sem fatura)
-- FABI - (sem valor = sem fatura)
-- DISTRIBUIDORA - (sem valor = sem fatura)
