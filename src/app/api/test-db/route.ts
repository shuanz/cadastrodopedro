import { NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('🔍 Testando conexão com banco de dados...')
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA')
    
    // Testar conexão
    await prisma.$connect()
    console.log('✅ Conexão estabelecida')
    
    // Testar uma query simples
    const userCount = await prisma.user.count()
    console.log('👥 Total de usuários:', userCount)
    
    const productCount = await prisma.product.count()
    console.log('📦 Total de produtos:', productCount)
    
    return NextResponse.json({
      success: true,
      message: 'Conexão com banco funcionando',
      data: {
        users: userCount,
        products: productCount,
        databaseUrl: process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA'
      }
    })
    
  } catch (error: unknown) {
    // Narrowing seguro para TypeScript
    if (error instanceof Error) {
      console.error('❌ Erro no teste de banco:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro de conexão com banco',
          details: error.message,
          databaseUrl: process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA'
        },
        { status: 500 }
      )
    }

    // Fallback para erros não-Error
    console.error('❌ Erro no teste de banco (tipo desconhecido):', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro de conexão com banco',
        details: String(error),
        databaseUrl: process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA'
      },
      { status: 500 }
    )
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('❌ Erro ao fechar conexão:', disconnectError)
    }
  }
}
