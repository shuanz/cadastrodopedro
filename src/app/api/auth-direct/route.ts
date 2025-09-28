import { NextResponse } from "next/server"
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

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

export async function POST(request: Request) {
  const client = await pool.connect()
  
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }
    
    console.log('🔐 Tentativa de login:', email)
    
    // Buscar usuário no banco
    const result = await client.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email]
    )
    
    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', email)
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      )
    }
    
    const user = result.rows[0]
    
    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      console.log('❌ Senha inválida para:', email)
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 }
      )
    }
    
    console.log('✅ Login bem-sucedido para:', email)
    
    // Retornar dados do usuário (sem senha)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
    
  } catch (error: unknown) {
    console.error('❌ Erro no login:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Erro interno do servidor',
          details: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: String(error)
      },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
