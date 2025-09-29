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
      SELECT c.*, COUNT(p.id) as product_count
      FROM "categories" c
      LEFT JOIN "Product" p ON c.name = p.category
      GROUP BY c.id
      ORDER BY c.name ASC
    `)

    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      productCount: parseInt(row.product_count)
    }))

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
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

    const { name, description } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se já existe uma categoria com o mesmo nome
    const existingCategory = await client.query(
      'SELECT id FROM "categories" WHERE name = $1',
      [name.trim()]
    )

    if (existingCategory.rows.length > 0) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome" },
        { status: 400 }
      )
    }

    const categoryId = `category-${Date.now()}`
    
    const result = await client.query(`
      INSERT INTO "categories" (id, name, description, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [categoryId, name.trim(), description?.trim() || null, true])

    const category = result.rows[0]

    return NextResponse.json(
      { message: "Categoria criada com sucesso", category },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
