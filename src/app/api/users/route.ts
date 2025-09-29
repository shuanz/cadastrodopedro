import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Pool } from 'pg'
import bcrypt from "bcryptjs"

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
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const result = await client.query(`
      SELECT id, name, email, role, "createdAt"
      FROM users
      ORDER BY "createdAt" DESC
    `)

    const users = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.createdAt
    }))

    return NextResponse.json(users)
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { name, email, password, role } = await request.json()

    // Verificar se o usuário já existe
    const existingUserResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: "Usuário já existe com este email" },
        { status: 400 }
      )
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Criar o usuário
    const userId = `user-${Date.now()}`
    const result = await client.query(`
      INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, name, email, role, "createdAt"
    `, [userId, name, email, hashedPassword, role || 'USER'])

    const user = result.rows[0]

    return NextResponse.json(
      { message: "Usuário criado com sucesso", user },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
