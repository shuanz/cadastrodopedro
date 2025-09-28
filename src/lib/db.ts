import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Configuração específica para Vercel/Serverless
  __internal: {
    engine: {
      binaryTargets: ['native'],
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Disconnect function for cleanup
export async function disconnectPrisma() {
  await prisma.$disconnect()
}
