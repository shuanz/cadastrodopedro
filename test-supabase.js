const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:zVDFeP9OIaa0a2Ab@db.ehrgyyehxkwrobdftxuk.supabase.co:5432/postgres?sslmode=require"
    }
  }
})

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...')
    await prisma.$connect()
    console.log('✅ Conexão estabelecida!')
    
    // Testar uma query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query executada:', result)
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message)
    console.error('❌ Código do erro:', error.code)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
