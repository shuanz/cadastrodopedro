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
    const result = await client.query(`
      SELECT i.*, p.name, p.category, p.unit, p.price, p."isActive"
      FROM "inventory" i
      LEFT JOIN "products" p ON i."productId" = p.id
      ORDER BY p.name ASC
    `)

    const inventory = result.rows.map(row => ({
      id: row.id,
      productId: row.productId,
      quantity: row.quantity,
      minQuantity: row.minQuantity,
      maxQuantity: row.maxQuantity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      product: {
        id: row.productId,
        name: row.name,
        category: row.category,
        unit: row.unit,
        price: parseFloat(row.price),
        isActive: row.isActive
      }
    }))

    return NextResponse.json(inventory)
  } catch (error) {
    console.error("Erro ao buscar estoque:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
