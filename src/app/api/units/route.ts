import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
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
    const result = await client.query(`
      SELECT u.*, COUNT(p.id) as product_count
      FROM "units" u
      LEFT JOIN "Product" p ON u.id = p."unitId"
      GROUP BY u.id
      ORDER BY u.name ASC
    `)

    const units = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      symbol: row.symbol,
      description: row.description,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      productCount: parseInt(row.product_count)
    }))

    return NextResponse.json(units)
  } catch (error) {
    console.error("Erro ao buscar unidades:", error)
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
    
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { name, symbol, description } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: "Nome da unidade é obrigatório" },
        { status: 400 }
      )
    }

    if (!symbol || symbol.trim() === '') {
      return NextResponse.json(
        { error: "Símbolo da unidade é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se já existe uma unidade com o mesmo nome ou símbolo
    const existingUnit = await client.query(
      'SELECT id FROM "units" WHERE name = $1 OR symbol = $2',
      [name.trim(), symbol.trim()]
    )

    if (existingUnit.rows.length > 0) {
      return NextResponse.json(
        { error: "Já existe uma unidade com este nome ou símbolo" },
        { status: 400 }
      )
    }

    const unitId = `unit-${Date.now()}`
    
    const result = await client.query(`
      INSERT INTO "units" (id, name, symbol, description, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [unitId, name.trim(), symbol.trim(), description?.trim() || null, true])

    const unit = result.rows[0]

    return NextResponse.json(
      { message: "Unidade criada com sucesso", unit },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar unidade:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
