import { NextResponse } from "next/server"
import { Pool } from 'pg'

// Configuração do pool de conexões
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function GET() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Testando conexão com banco de dados (conexão direta)...')
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA')

    // Testar conexão
    await client.query('SELECT 1')

    // Contar usuários
    const userResult = await client.query('SELECT COUNT(*) as count FROM users')
    const userCount = parseInt(userResult.rows[0].count)

    // Contar produtos
    const productResult = await client.query('SELECT COUNT(*) as count FROM "products"')
    const productCount = parseInt(productResult.rows[0].count)

    console.log(`📊 Usuários: ${userCount}, Produtos: ${productCount}`)

    return NextResponse.json({
      success: true,
      message: 'Conexão com banco de dados bem-sucedida!',
      data: {
        users: userCount,
        products: productCount,
        databaseUrl: process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA'
      }
    })
    
  } catch (error: unknown) {
    console.error('❌ Erro no teste de banco:', error)
    
    if (error instanceof Error) {
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
    client.release()
  }
}
