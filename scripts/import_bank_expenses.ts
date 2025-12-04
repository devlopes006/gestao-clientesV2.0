import {
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
} from '@prisma/client'
import dotenv from 'dotenv'
import { prisma } from '../src/lib/prisma'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

// Dados do CSV - apenas valores negativos (saídas)
const bankExpenses = [
  // Outubro 2025
  {
    date: '2025-10-01',
    amount: 250.0,
    description: 'Transferência JOSUE VITO QUEIROZ MONTEIRO',
    identifier: '68dd3f4f-20b6-48de-b330-e96d41fc4661',
  },
  {
    date: '2025-10-01',
    amount: 84.11,
    description: 'Transferência RECEITA FEDERAL',
    identifier: '68ddde96-ebdd-42d2-94c3-a14a6afe7cc2',
  },
  {
    date: '2025-10-01',
    amount: 150.0,
    description: 'Transferência Luzia da Silva Rodrigues',
    identifier: '68dde0ea-aa1a-44f6-8cff-83bcc1166356',
  },
  {
    date: '2025-10-04',
    amount: 35.0,
    description:
      'Transferência LUCIA COMERCIO E REPRESENTACOES DE PRODUTOS DE BAZARES LTDA',
    identifier: '68e1474d-674d-47db-8aa6-2d0ab4853eb9',
  },
  {
    date: '2025-10-05',
    amount: 35.82,
    description: 'Transferência IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.',
    identifier: '68e2fe81-74b4-4f43-97db-9b946aba3d3d',
  },
  {
    date: '2025-10-07',
    amount: 46.07,
    description: 'Transferência Esther Maia de Souza',
    identifier: '68e48667-0c16-4e35-a3e9-ff995d2bf14a',
  },
  {
    date: '2025-10-09',
    amount: 100.0,
    description: 'Transferência ESTHER MAIA LOPES',
    identifier: '68e85eb1-6567-4f7c-896a-e5bce8d6c2e5',
  },
  {
    date: '2025-10-09',
    amount: 80.0,
    description: 'Transferência LUISE GABRIELLE DA SILVA RODRIGUES',
    identifier: '68e860c8-7b55-41b5-9771-d1d5a56dfd7a',
  },
  {
    date: '2025-10-09',
    amount: 5.0,
    description: 'Transferência ESTHER MAIA LOPES',
    identifier: '68e86261-2214-45b8-9133-5a380b7bb817',
  },
  {
    date: '2025-10-10',
    amount: 748.18,
    description: 'Transferência ESTHER MAIA LOPES',
    identifier: '68e96647-6ca0-4797-8845-8e9a89f0835d',
  },
  {
    date: '2025-10-10',
    amount: 215.6,
    description: 'Transferência MALBS (PAGAR.ME PAGAMENTOS)',
    identifier: '68e9a8e0-189d-4612-9bae-4eb3bfabe6f6',
  },
  {
    date: '2025-10-10',
    amount: 500.0,
    description: 'Transferência JOSUE VITO QUEIROZ MONTEIRO',
    identifier: '68e9ab77-7888-4c1c-a6c3-1e401b5348c9',
  },
  {
    date: '2025-10-11',
    amount: 65.0,
    description: 'Transferência ESTHER MAIA LOPES',
    identifier: '68eae9d0-fc4c-4b7e-9660-d4e2ce6c69c1',
  },
  {
    date: '2025-10-14',
    amount: 300.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '68eea3c1-ff4c-432b-97a5-6056342b835e',
  },
  {
    date: '2025-10-15',
    amount: 300.0,
    description: 'Transferência Marcelo Silva de Souza',
    identifier: '68efa823-09c0-480c-b671-64e533020845',
  },
  {
    date: '2025-10-15',
    amount: 100.0,
    description: 'Transferência ADRIANA CARVALHO PIMENTEL',
    identifier: '68f03e22-55d7-4e3b-86fe-1acfa46477d7',
  },
  {
    date: '2025-10-18',
    amount: 80.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '68f3ae62-ae8d-4ea0-8353-ac134a148e8f',
  },
  {
    date: '2025-10-18',
    amount: 60.0,
    description: 'Transferência Esther Maia Lopes',
    identifier: '68f3ed58-8ffb-4466-ae41-4b612215f739',
  },
  {
    date: '2025-10-18',
    amount: 87.52,
    description: 'Transferência TELEFONICA BRAS',
    identifier: '68f43078-4270-46e6-b3dd-cafc67e900e3',
  },
  {
    date: '2025-10-18',
    amount: 100.0,
    description: 'Transferência Esther Maia Lopes',
    identifier: '68f43e7c-1252-4def-973c-e52f62d22751',
  },
  {
    date: '2025-10-19',
    amount: 100.0,
    description: 'Transferência Esther Maia Lopes',
    identifier: '68f52dad-e67f-441f-b624-dcbaacfdb58f',
  },
  {
    date: '2025-10-19',
    amount: 55.99,
    description: 'Transferência IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.',
    identifier: '68f57d99-c879-4e94-bec7-1c84964af69d',
  },
  {
    date: '2025-10-21',
    amount: 150.0,
    description: 'Transferência Luzia da Silva Rodrigues',
    identifier: '68f817ef-9d8e-4707-b9ee-6b7a501481df',
  },
  {
    date: '2025-10-22',
    amount: 34.89,
    description: 'Transferência IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.',
    identifier: '68f98693-a26e-4261-98e1-f4d074550879',
  },
  {
    date: '2025-10-23',
    amount: 45.99,
    description: 'Transferência IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.',
    identifier: '68fad0a4-15ee-4b70-9a8b-2366ed5eca57',
  },
  {
    date: '2025-10-24',
    amount: 70.0,
    description: 'Transferência RALYSON SENA DA SILVA',
    identifier: '68fc1ed0-e402-47dc-a75e-e8927bae68c3',
  },
  {
    date: '2025-10-25',
    amount: 52.89,
    description: 'Transferência IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.',
    identifier: '68fc3dc4-1e48-459b-9385-49d2b9924349',
  },
  {
    date: '2025-10-25',
    amount: 31.9,
    description: 'Transferência PANIFICADORA RECANTO DOS PAES',
    identifier: '68fcce2b-1a97-461b-91b7-85c5302ee3e4',
  },
  {
    date: '2025-10-25',
    amount: 119.8,
    description: 'Transferência I LOVE BRECHO',
    identifier: '68fcd848-95d9-412c-af73-702563e7e871',
  },
  {
    date: '2025-10-25',
    amount: 305.0,
    description: 'Transferência ANDERSON DA SILVA LOPES',
    identifier: '68fcf7fc-690f-4d92-acb2-475ece189d15',
  },
  {
    date: '2025-10-25',
    amount: 88.88,
    description: 'Transferência BOTEQUIM GUANABARA',
    identifier: '68fd0514-aad3-4434-a6b8-aefd91290bae',
  },
  {
    date: '2025-10-25',
    amount: 13.0,
    description: 'Transferência FLORIPA ALIMENTOS',
    identifier: '68fd063d-262b-4d09-8e13-02a9dffa4433',
  },
  {
    date: '2025-10-25',
    amount: 56.9,
    description: 'Transferência Livraria Nobel',
    identifier: '68fd0d50-4699-4bec-b13f-e4ce9b07575e',
  },
  {
    date: '2025-10-25',
    amount: 80.0,
    description: 'Transferência FACEBOOK SERVICOS ONLINE DO BRASIL LTDA',
    identifier: '68fd4728-0c6d-4311-ad74-a6fa69029a21',
  },
  {
    date: '2025-10-26',
    amount: 35.0,
    description: 'Compra no débito - LAUNDREXPRESS',
    identifier: '68feae5f-7e83-4347-a34f-650928da1799',
  },
  {
    date: '2025-10-26',
    amount: 17.98,
    description: 'Compra no débito - HIPER SELECT SUPERMERC',
    identifier: '68feafc3-7305-4645-b6d1-64af785c897b',
  },
  {
    date: '2025-10-26',
    amount: 17.5,
    description: 'Compra no débito - LAUNDREXPRESS',
    identifier: '68feba17-6bae-4739-b369-c5acbed6959c',
  },
  {
    date: '2025-10-26',
    amount: 70.96,
    description: 'Transferência IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.',
    identifier: '68fecdce-8999-4b17-a46f-bad00e48f455',
  },
  {
    date: '2025-10-27',
    amount: 20.0,
    description: 'Transferência ANDERSON DA SILVA LOPES',
    identifier: '68ffb12a-89df-4b39-aa08-7f4c0e05b4ed',
  },
  {
    date: '2025-10-28',
    amount: 36.0,
    description: 'Transferência Anderson da Silva Lopes',
    identifier: '690171dc-1d33-49f8-90a0-c074e137f0d4',
  },
  {
    date: '2025-10-29',
    amount: 50.0,
    description: 'Transferência Anderson da Silva Lopes',
    identifier: '6902011f-db86-4c56-811d-50ab037728f4',
  },
  {
    date: '2025-10-30',
    amount: 380.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '6903c771-f95f-4bdb-bb16-aa2a39473f7c',
  },
  {
    date: '2025-10-30',
    amount: 45.99,
    description: 'Transferência IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.',
    identifier: '6903db26-2b23-47fa-a900-f3953def17a9',
  },
  {
    date: '2025-10-30',
    amount: 125.0,
    description: 'Transferência KEVIM CARLOS MAGALHAES DA SILVA',
    identifier: '69041e03-a5ac-4b56-b1a0-7c28189b2b00',
  },
  {
    date: '2025-10-31',
    amount: 3.99,
    description: 'Transferência IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.',
    identifier: '69056d01-e854-4933-9d4f-e771ad2d275a',
  },
  {
    date: '2025-10-31',
    amount: 0.99,
    description: 'Transferência Esther Maia Lopes',
    identifier: '69056dc9-1709-4f6d-af2b-ca43c46d5d18',
  },

  // Novembro 2025
  {
    date: '2025-11-01',
    amount: 36.4,
    description: 'Transferência PANIFICADORA RECANTO DOS PAES',
    identifier: '69061531-855f-4d7d-ad5e-374ecf4e4486',
  },
  {
    date: '2025-11-01',
    amount: 120.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '69068e0b-2fca-4086-a9dd-f02d0df35f26',
  },
  {
    date: '2025-11-02',
    amount: 69.96,
    description: 'Transferência GRILL BURGER',
    identifier: '6907f58f-3e93-440c-830f-cf255beccf2b',
  },
  {
    date: '2025-11-03',
    amount: 125.0,
    description: 'Transferência KEVIM CARLOS MAGALHAES DA SILVA',
    identifier: '6908c18b-b351-40f0-82c5-c89838193214',
  },
  {
    date: '2025-11-03',
    amount: 80.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '69091805-3924-45e7-b7bb-0c638060bbce',
  },
  {
    date: '2025-11-03',
    amount: 50.0,
    description: 'Transferência ESTHER MAIA LOPES',
    identifier: '69096c28-af0c-4968-8ca0-1b4eae31816c',
  },
  {
    date: '2025-11-04',
    amount: 10.0,
    description: 'Transferência ESTHER MAIA LOPES',
    identifier: '69096d11-a2b5-4f74-972f-dea0371e4986',
  },
  {
    date: '2025-11-06',
    amount: 800.0,
    description: 'Transferência ESTHER MAIA LOPES',
    identifier: '690cc744-d8a2-416d-9a6e-7862613d9264',
  },
  {
    date: '2025-11-10',
    amount: 100.0,
    description: 'Transferência Darlon Ribeiro Gomes',
    identifier: '6912092b-aac6-4d82-b3fe-4405835e0c78',
  },
  {
    date: '2025-11-10',
    amount: 80.9,
    description: 'Transferência RECEITA FEDERAL',
    identifier: '69124dff-fe8c-471a-b985-c9c74e6b1416',
  },
  {
    date: '2025-11-10',
    amount: 1000.0,
    description: 'Transferência Esther Maia Lopes',
    identifier: '691252da-4c1f-44e2-84a5-540b7bed101e',
  },
  {
    date: '2025-11-11',
    amount: 259.5,
    description: 'Transferência PAGAR.ME PAGAMENTOS',
    identifier: '69135ce8-04fa-4dcf-b885-c1897f47ff35',
  },
  {
    date: '2025-11-12',
    amount: 65.0,
    description: 'Transferência ESTHER MAIA LOPES',
    identifier: '69152457-9957-4907-b8fb-ec09345369e9',
  },
  {
    date: '2025-11-14',
    amount: 150.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '691786ef-a97a-409b-b414-dd288abebf16',
  },
  {
    date: '2025-11-15',
    amount: 225.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '69184c58-894a-4d44-9d73-acacc87ed069',
  },
  {
    date: '2025-11-15',
    amount: 100.0,
    description: 'Transferência ESTHER MAIA LOPES',
    identifier: '6918937e-3191-4f0e-a2b3-c404feef7fee',
  },
  {
    date: '2025-11-17',
    amount: 10.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '691b6397-60f5-4ce2-a468-f31819a0cf2f',
  },
  {
    date: '2025-11-17',
    amount: 20.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '691b63ec-a7b8-46f8-a0ba-ffd9cd98b942',
  },
  {
    date: '2025-11-17',
    amount: 59.89,
    description: 'Transferência IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.',
    identifier: '691bb982-53b2-40e0-8fdc-7698640fcecc',
  },
  {
    date: '2025-11-18',
    amount: 300.0,
    description: 'Transferência LUISE GABRIELLE DA SILVA RODRIGUES',
    identifier: '691c4a3e-661f-46b9-a69f-24f14465b0be',
  },
  {
    date: '2025-11-18',
    amount: 1000.0,
    description: 'Transferência Luise Gabrielle da Silva Rodrigues',
    identifier: '691c517d-13b1-4705-829a-3a688472bbe2',
  },
  {
    date: '2025-11-18',
    amount: 47.5,
    description: 'Compra no débito - MINI KALZONE PP',
    identifier: '691cd54e-f776-48b0-8177-b15c9bf06ada',
  },
  {
    date: '2025-11-18',
    amount: 64.73,
    description: 'Compra no débito - HIPER SELECT SUPERMERC',
    identifier: '691cdaf1-8738-45ac-a7bb-289822f90795',
  },
  {
    date: '2025-11-19',
    amount: 53.0,
    description: 'Transferência LUISE GABRIELLE DA SILVA RODRIGUES',
    identifier: '691e3748-fd0d-4a6c-993c-47431d16d74d',
  },
  {
    date: '2025-11-20',
    amount: 125.0,
    description: 'Transferência KEVIM CARLOS MAGALHAES DA SILVA',
    identifier: '691fbab9-2484-44f7-a4e2-6aa06ac61d27',
  },
  {
    date: '2025-11-22',
    amount: 125.0,
    description: 'Transferência KEVIM CARLOS MAGALHAES DA SILVA',
    identifier: '69226043-fe1a-4539-b129-0d939fdf17a8',
  },
  {
    date: '2025-11-23',
    amount: 240.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '69233e4d-d14e-47d5-b287-58aa0b4ca113',
  },
  {
    date: '2025-11-23',
    amount: 100.0,
    description: 'Transferência ESTHER MAIA LOPES',
    identifier: '6923423a-9132-4298-9c72-97f607a8a989',
  },
  {
    date: '2025-11-29',
    amount: 200.0,
    description: 'Transferência Esther Maia Lopes',
    identifier: '692b0688-dcb3-4b3d-b35d-47dad17351c9',
  },
  {
    date: '2025-11-29',
    amount: 70.0,
    description: 'Transferência Darlon Ribeiro Gomes',
    identifier: '692b85bc-2cc9-4819-a440-e9f2df9efcf3',
  },
  {
    date: '2025-11-30',
    amount: 225.0,
    description: 'Transferência Flavia Leticia Rodrigues Marinho',
    identifier: '692c0c07-4327-4b0c-b345-ce000e606622',
  },

  // Dezembro 2025
  {
    date: '2025-12-01',
    amount: 272.0,
    description: 'Transferência Anderson da Silva Lopes',
    identifier: '692d86ac-e920-4621-b512-668673a7ed7d',
  },
  {
    date: '2025-12-01',
    amount: 99.99,
    description: 'Transferência TELEFONICA BRAS',
    identifier: '692e0f06-2b5f-4d8e-b508-a1ac95e20db0',
  },
]

// Função para categorizar automaticamente baseado na descrição
function categorizeExpense(description: string): {
  category: string
  subtype: TransactionSubtype
} {
  const desc = description.toLowerCase()

  // Alimentação
  if (
    desc.includes('ifood') ||
    desc.includes('burger') ||
    desc.includes('kalzone') ||
    desc.includes('restaurante') ||
    desc.includes('botequim')
  ) {
    return { category: 'ALIMENTACAO', subtype: 'OTHER_EXPENSE' }
  }

  // Supermercado
  if (desc.includes('supermerc') || desc.includes('hiper')) {
    return { category: 'SUPERMERCADO', subtype: 'OTHER_EXPENSE' }
  }

  // Serviços (lavanderia)
  if (desc.includes('laundrexpress')) {
    return { category: 'SERVICOS', subtype: 'OTHER_EXPENSE' }
  }

  // Telecom
  if (
    desc.includes('telefonica') ||
    desc.includes('vivo') ||
    desc.includes('tim')
  ) {
    return { category: 'TELECOM', subtype: 'FIXED_EXPENSE' }
  }

  // Impostos
  if (desc.includes('receita federal') || desc.includes('imposto')) {
    return { category: 'IMPOSTOS', subtype: 'FIXED_EXPENSE' }
  }

  // Marketing/Ads
  if (
    desc.includes('facebook') ||
    desc.includes('instagram') ||
    desc.includes('ads')
  ) {
    return { category: 'MARKETING', subtype: 'FIXED_EXPENSE' }
  }

  // Pagamentos gateway
  if (
    desc.includes('pagar.me') ||
    desc.includes('pagseguro') ||
    desc.includes('mercado pago')
  ) {
    return { category: 'TAXAS_GATEWAY', subtype: 'FIXED_EXPENSE' }
  }

  // Fornecedores
  if (
    desc.includes('panificadora') ||
    desc.includes('livraria') ||
    desc.includes('comercio') ||
    desc.includes('lucia comercio') ||
    desc.includes('floripa alimentos')
  ) {
    return { category: 'FORNECEDORES', subtype: 'OTHER_EXPENSE' }
  }

  // Pessoal (transferências para pessoas)
  if (
    desc.includes('esther') ||
    desc.includes('luise') ||
    desc.includes('flavia') ||
    desc.includes('anderson') ||
    desc.includes('darlon') ||
    desc.includes('marcelo') ||
    desc.includes('adriana') ||
    desc.includes('kevim') ||
    desc.includes('ralyson') ||
    desc.includes('luzia') ||
    desc.includes('josue')
  ) {
    return { category: 'PESSOAL', subtype: 'OTHER_EXPENSE' }
  }

  // Outros (lojas, compras diversas)
  if (desc.includes('brecho') || desc.includes('compra')) {
    return { category: 'OUTROS', subtype: 'OTHER_EXPENSE' }
  }

  // Default
  return { category: 'OUTROS', subtype: 'OTHER_EXPENSE' }
}

async function importExpenses(orgId: string, dryRun: boolean = false) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`IMPORTAÇÃO DE DESPESAS DO EXTRATO BANCÁRIO`)
  console.log(`${'='.repeat(60)}`)
  console.log(`Organização: ${orgId}`)
  console.log(`Modo: ${dryRun ? 'DRY-RUN (simulação)' : 'PRODUÇÃO'}`)
  console.log(`Total de transações: ${bankExpenses.length}`)
  console.log(`${'='.repeat(60)}\n`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const expense of bankExpenses) {
    try {
      // Verificar se já existe pelo identificador único
      const existing = await prisma.transaction.findFirst({
        where: {
          orgId,
          metadata: {
            path: ['bankIdentifier'],
            equals: expense.identifier,
          },
        },
      })

      if (existing) {
        console.log(
          `⏭️  Já existe: ${expense.date} - ${expense.description} (R$ ${expense.amount.toFixed(2)})`
        )
        skipped++
        continue
      }

      const { category, subtype } = categorizeExpense(expense.description)

      if (!dryRun) {
        await prisma.transaction.create({
          data: {
            orgId,
            type: TransactionType.EXPENSE,
            subtype,
            amount: expense.amount,
            description: expense.description,
            category,
            date: new Date(expense.date),
            status: TransactionStatus.CONFIRMED,
            metadata: {
              bankIdentifier: expense.identifier,
              source: 'bank_csv_import',
              importDate: new Date().toISOString(),
            },
          },
        })
      }

      console.log(
        `✅ ${dryRun ? '[DRY-RUN] ' : ''}Importado: ${expense.date} - ${category} - R$ ${expense.amount.toFixed(2)} - ${expense.description}`
      )
      imported++
    } catch (error) {
      console.error(
        `❌ Erro ao importar: ${expense.date} - ${expense.description}`
      )
      console.error(error)
      errors++
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`RESUMO DA IMPORTAÇÃO`)
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Importadas: ${imported}`)
  console.log(`⏭️  Já existiam: ${skipped}`)
  console.log(`❌ Erros: ${errors}`)
  console.log(`📊 Total processado: ${bankExpenses.length}`)

  // Calcular totais por categoria
  const categoryTotals: Record<string, number> = {}
  bankExpenses.forEach((expense) => {
    const { category } = categorizeExpense(expense.description)
    categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
  })

  console.log(`\n📈 TOTAIS POR CATEGORIA:`)
  Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, total]) => {
      console.log(`   ${category}: R$ ${total.toFixed(2)}`)
    })

  const grandTotal = bankExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  console.log(`\n💰 TOTAL GERAL: R$ ${grandTotal.toFixed(2)}`)
  console.log(`${'='.repeat(60)}\n`)
}

async function main() {
  const args = process.argv.slice(2)
  const dryRunIdx = args.indexOf('--dry-run')
  const isDryRun = dryRunIdx !== -1

  // Remove --dry-run dos args para pegar o orgId
  const cleanArgs = args.filter((arg) => arg !== '--dry-run')
  const orgId = cleanArgs[0]

  if (!orgId) {
    console.error('❌ Erro: orgId é obrigatório')
    console.log(
      'Uso: pnpm tsx scripts/import_bank_expenses.ts <orgId> [--dry-run]'
    )
    process.exit(1)
  }

  try {
    await importExpenses(orgId, isDryRun)
  } catch (error) {
    console.error('❌ Erro ao importar despesas:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
