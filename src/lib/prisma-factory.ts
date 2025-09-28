import { PrismaClient } from '@prisma/client'

// Factory function para criar instâncias do Prisma Client
export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Para desenvolvimento, usar singleton
let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'production') {
  // Em produção, sempre criar nova instância
  prisma = createPrismaClient()
} else {
  // Em desenvolvimento, usar singleton
  if (!globalThis.__prisma) {
    globalThis.__prisma = createPrismaClient()
  }
  prisma = globalThis.__prisma
}

export { prisma }
