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
      SELECT p.*, i.quantity, i."minQuantity", i."maxQuantity"
      FROM "Product" p
      LEFT JOIN "Inventory" i ON p.id = i."productId"
      ORDER BY p."createdAt" DESC
    `)

    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      cost: row.cost ? parseFloat(row.cost) : null,
      category: row.category,
      unit: row.unit,
      barcode: row.barcode,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      inventory: {
        quantity: row.quantity || 0,
        minQuantity: row.minQuantity || 0,
        maxQuantity: row.maxQuantity
      }
    }))

    return NextResponse.json(products)
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
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

    const {
      name,
      description,
      price,
      cost,
      category,
      unit,
      barcode,
      minQuantity,
      maxQuantity,
    } = await request.json()

    // Verificar se já existe produto com o mesmo código de barras
    if (barcode) {
      const existingProduct = await client.query(
        'SELECT id FROM "Product" WHERE barcode = $1',
        [barcode]
      )

      if (existingProduct.rows.length > 0) {
        return NextResponse.json(
          { error: "Já existe um produto com este código de barras" },
          { status: 400 }
        )
      }
    }

    // Criar produto e estoque em uma transação
    await client.query('BEGIN')
    
    try {
      const productResult = await client.query(`
        INSERT INTO "Product" (id, name, description, price, cost, category, unit, barcode, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `, [
        `product-${Date.now()}`,
        name,
        description,
        price,
        cost,
        category,
        unit,
        barcode,
        true
      ])

      const product = productResult.rows[0]

      await client.query(`
        INSERT INTO "Inventory" (id, "productId", quantity, "minQuantity", "maxQuantity", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        `inventory-${Date.now()}`,
        product.id,
        0,
        minQuantity,
        maxQuantity
      ])

      await client.query('COMMIT')

      return NextResponse.json(
        { message: "Produto criado com sucesso", product },
        { status: 201 }
      )
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error("Erro ao criar produto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
