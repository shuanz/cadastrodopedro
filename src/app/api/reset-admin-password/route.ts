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

export async function POST() {
  const client = await pool.connect()
  
  try {
    console.log('🔐 Atualizando senha do admin...')
    
    const adminEmail = 'admin@cadastrodopedro.com'
    const adminPassword = 'admin123'
    
    // Gerar novo hash da senha
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    console.log('🔑 Novo hash gerado:', hashedPassword)
    
    // Atualizar a senha do admin
    const result = await client.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, name, email, role',
      [hashedPassword, adminEmail]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Usuário admin não encontrado'
      }, { status: 404 })
    }
    
    console.log('✅ Senha do admin atualizada com sucesso!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Senha:', adminPassword)
    
    return NextResponse.json({
      success: true,
      message: 'Senha do admin atualizada com sucesso!',
      credentials: {
        email: adminEmail,
        password: adminPassword
      },
      user: result.rows[0]
    })
    
  } catch (error: unknown) {
    console.error('❌ Erro ao atualizar senha:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao atualizar senha',
          details: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao atualizar senha',
        details: String(error)
      },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
