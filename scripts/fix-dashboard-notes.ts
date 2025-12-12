/**
 * Script para corrigir notas do dashboard com dados faltantes
 * Preenche title e color para notas com valores null/undefined
 */

import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function fixDashboardNotes() {
  console.log('🔍 Buscando notas com dados faltantes...')

  // Buscar todas as notas
  const allNotes = await prisma.dashboardNote.findMany({
    select: {
      id: true,
      title: true,
      content: true,
      color: true,
    },
  })

  console.log(`📝 Encontradas ${allNotes.length} notas no total`)

  let fixed = 0

  for (const note of allNotes) {
    const needsFix = !note.title || !note.color

    if (needsFix) {
      console.log(`\n🔧 Corrigindo nota ${note.id}:`)
      console.log(`   Title antes: "${note.title}"`)
      console.log(`   Color antes: "${note.color}"`)

      const newTitle =
        note.title || (note.content ? note.content.slice(0, 60) : 'Sem título')
      const newColor = note.color || 'yellow'

      await prisma.dashboardNote.update({
        where: { id: note.id },
        data: {
          title: newTitle,
          color: newColor,
        },
      })

      console.log(`   Title depois: "${newTitle}"`)
      console.log(`   Color depois: "${newColor}"`)
      fixed++
    }
  }

  console.log(`\n✅ ${fixed} notas foram corrigidas!`)
  console.log(`✓ ${allNotes.length - fixed} notas já estavam corretas`)
}

fixDashboardNotes()
  .catch((error) => {
    console.error('❌ Erro ao corrigir notas:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
