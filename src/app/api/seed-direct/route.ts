import { NextResponse } from "next/server"
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

// Configuração do pool de conexões
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1, // Limitar conexões para evitar problemas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function POST() {
  const client = await pool.connect()
  
  try {
    console.log('🌱 Executando seed manual com conexão direta...')
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA')

    // Verificar se o admin já existe
    const adminEmail = 'admin@cadastrodopedro.com'
    const adminPassword = 'admin123'

    const existingAdmin = await client.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [adminEmail]
    )

    if (existingAdmin.rows.length > 0) {
      console.log('ℹ️  Usuário administrador já existe')
      return NextResponse.json({
        success: true,
        message: 'Usuário administrador já existe',
        credentials: {
          email: adminEmail,
          password: adminPassword
        }
      })
    }

    // Criar usuário administrador
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    const userId = `admin-${Date.now()}`
    
    await client.query(
      `INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [userId, 'Administrador', adminEmail, hashedPassword, 'ADMIN']
    )

    console.log('✅ Usuário administrador criado:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Senha: ${adminPassword}`)

    return NextResponse.json({
      success: true,
      message: 'Usuário administrador criado com sucesso!',
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    })
    
  } catch (error: unknown) {
    console.error('❌ Erro durante o seed:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro durante o seed',
          details: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro durante o seed',
        details: String(error)
      },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
