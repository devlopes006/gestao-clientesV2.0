import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    org: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Mock Firebase Admin
const mockDocMethods = {
  get: vi.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
}

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => mockDocMethods),
    })),
  })),
  FieldValue: {
    arrayUnion: vi.fn((val) => val),
  },
}))

import { prisma } from '@/lib/prisma'
import { handleUserOnboarding } from '@/services/auth/onboarding'

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  member: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  org: {
    create: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

describe('handleUserOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update existing user last login', async () => {
    const mockUser = {
      id: 'user-1',
      firebaseUid: 'firebase-uid-1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockedPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockedPrisma.user.update.mockResolvedValue(mockUser)

    await handleUserOnboarding({
      uid: 'firebase-uid-1',
      email: 'test@example.com',
      name: 'Test User',
    })

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { firebaseUid: 'firebase-uid-1' },
    })
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { firebaseUid: 'firebase-uid-1' },
      data: { updatedAt: expect.any(Date) },
    })
  })

  it('should create new user with org when user does not exist', async () => {
    const mockUser = {
      id: 'user-1',
      firebaseUid: 'firebase-uid-new',
      email: 'newuser@example.com',
      name: 'New User',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockOrg = {
      id: 'org-1',
      name: "New User's Org",
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockedPrisma.user.findUnique
      .mockResolvedValueOnce(null) // firebaseUid not found
      .mockResolvedValueOnce(null) // email not found

    mockedPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockedPrisma)
    })

    mockedPrisma.user.create.mockResolvedValue(mockUser)
    mockedPrisma.org.create.mockResolvedValue(mockOrg)
    mockedPrisma.member.create.mockResolvedValue({
      id: 'member-1',
      userId: 'user-1',
      orgId: 'org-1',
      role: 'OWNER',
      isActive: true,
    })

    await handleUserOnboarding({
      uid: 'firebase-uid-new',
      email: 'newuser@example.com',
      name: 'New User',
    })

    expect(mockedPrisma.user.create).toHaveBeenCalledWith({
      data: {
        firebaseUid: 'firebase-uid-new',
        email: 'newuser@example.com',
        name: 'New User',
      },
    })
  })

  it('should create user without org when skipOrgCreation is true', async () => {
    const mockUser = {
      id: 'user-1',
      firebaseUid: 'firebase-uid-invited',
      email: 'invited@example.com',
      name: 'Invited User',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockedPrisma.user.findUnique
      .mockResolvedValueOnce(null) // firebaseUid not found
      .mockResolvedValueOnce(null) // email not found

    mockedPrisma.user.create.mockResolvedValue(mockUser)

    await handleUserOnboarding({
      uid: 'firebase-uid-invited',
      email: 'invited@example.com',
      name: 'Invited User',
      skipOrgCreation: true,
    })

    expect(mockedPrisma.user.create).toHaveBeenCalledWith({
      data: {
        firebaseUid: 'firebase-uid-invited',
        email: 'invited@example.com',
        name: 'Invited User',
      },
    })
    expect(mockedPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('should link existing email to new firebase uid', async () => {
    const existingUser = {
      id: 'user-existing',
      firebaseUid: null,
      email: 'existing@example.com',
      name: 'Existing User',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const updatedUser = {
      ...existingUser,
      firebaseUid: 'firebase-uid-new',
    }

    mockedPrisma.user.findUnique
      .mockResolvedValueOnce(null) // firebaseUid not found
      .mockResolvedValueOnce(existingUser) // email found

    mockedPrisma.user.update.mockResolvedValue(updatedUser)
    mockedPrisma.member.findFirst.mockResolvedValue(null)

    await handleUserOnboarding({
      uid: 'firebase-uid-new',
      email: 'existing@example.com',
      name: 'Existing User',
    })

    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { email: 'existing@example.com' },
      data: {
        firebaseUid: 'firebase-uid-new',
        name: 'Existing User',
        updatedAt: expect.any(Date),
      },
    })
  })
})
