import { prisma } from '@/lib/prisma'
import { getFirestore } from 'firebase-admin/firestore'

export interface OnboardingData {
  uid: string
  email: string
  name: string
}

/**
 * Cria o usuário e a organização na primeira autenticação.
 * Persiste tanto no Firestore (tempo real) quanto no PostgreSQL (queries).
 * Se já existir, apenas atualiza o último login.
 */
export async function handleUserOnboarding({
  uid,
  email,
  name,
}: OnboardingData) {
  const db = getFirestore()
  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()

  if (userSnap.exists) {
    // Usuário já existe → apenas atualiza login no Firestore
    await userRef.update({ lastLogin: new Date() })

    // Verifica se usuário existe no PostgreSQL antes de atualizar
    const existingUser = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    })

    if (existingUser) {
      await prisma.user.update({
        where: { firebaseUid: uid },
        data: { updatedAt: new Date() },
      })
    } else {
      console.warn(
        `⚠️ Usuário ${uid} existe no Firestore mas não no PostgreSQL. Sincronizando...`
      )
      // Sincroniza do Firestore para PostgreSQL
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            firebaseUid: uid,
            email,
            name,
          },
        })

        const org = await tx.org.create({
          data: {
            name: `${name}'s Org`,
            ownerId: user.id,
          },
        })

        await tx.member.create({
          data: {
            userId: user.id,
            orgId: org.id,
            role: 'OWNER',
          },
        })

        return { user, org }
      })
      console.log(
        `✅ Usuário sincronizado no PostgreSQL (ID: ${result.user.id})`
      )
    }
    return
  }

  // ✅ Cria novo usuário e org no PostgreSQL (transação)
  const result = await prisma.$transaction(async (tx) => {
    // Cria User
    const user = await tx.user.create({
      data: {
        firebaseUid: uid,
        email,
        name,
      },
    })

    // Cria Org com owner
    const org = await tx.org.create({
      data: {
        name: `${name}'s Org`,
        ownerId: user.id,
      },
    })

    // Cria Member (vínculo do owner com a org)
    await tx.member.create({
      data: {
        userId: user.id,
        orgId: org.id,
        role: 'OWNER',
      },
    })

    return { user, org }
  })

  // ✅ Cria também no Firestore (para queries em tempo real)
  const orgId = result.org.id
  const orgRef = db.collection('orgs').doc(orgId)

  await orgRef.set({
    name: result.org.name,
    ownerId: uid,
    members: [uid],
    createdAt: new Date(),
  })

  await userRef.set({
    uid,
    email,
    name,
    orgId,
    role: 'OWNER',
    createdAt: new Date(),
    lastLogin: new Date(),
  })

  console.log(`✅ Novo usuário criado: ${name} (${email})`)
  console.log(
    `✅ Persistido no PostgreSQL (User ID: ${result.user.id}, Org ID: ${result.org.id})`
  )
}
