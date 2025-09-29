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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()
  
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { quantity } = await request.json()
    const { id } = await params

    if (quantity < 0) {
      return NextResponse.json(
        { error: "Quantidade não pode ser negativa" },
        { status: 400 }
      )
    }

    // Verificar se o produto existe
    const productCheck = await client.query(
      'SELECT id FROM "products" WHERE id = $1',
      [id]
    )

    if (productCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    // Atualizar o estoque
    const result = await client.query(`
      UPDATE "inventory" 
      SET quantity = $1, "updatedAt" = NOW()
      WHERE "productId" = $2
      RETURNING *
    `, [quantity, id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Estoque não encontrado" },
        { status: 404 }
      )
    }

    // Buscar dados completos do produto e estoque
    const inventoryResult = await client.query(`
      SELECT i.*, p.name, p.category, p.unit, p.price, p."isActive"
      FROM "inventory" i
      LEFT JOIN "products" p ON i."productId" = p.id
      WHERE i."productId" = $1
    `, [id])

    const inventory = inventoryResult.rows[0]

    const response = {
      id: inventory.id,
      productId: inventory.productId,
      quantity: inventory.quantity,
      minQuantity: inventory.minQuantity,
      maxQuantity: inventory.maxQuantity,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt,
      product: {
        id: inventory.productId,
        name: inventory.name,
        category: inventory.category,
        unit: inventory.unit,
        price: parseFloat(inventory.price),
        isActive: inventory.isActive
      }
    }

    return NextResponse.json(
      { message: "Estoque atualizado com sucesso", inventory: response },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()
  
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar se o produto existe
    const productCheck = await client.query(
      'SELECT id FROM "products" WHERE id = $1',
      [id]
    )

    if (productCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se há vendas associadas ao produto
    const salesCheck = await client.query(
      'SELECT COUNT(*) as count FROM "sale_items" WHERE "productId" = $1',
      [id]
    )

    if (parseInt(salesCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir produto com vendas associadas" },
        { status: 400 }
      )
    }

    // Deletar o estoque
    const inventoryResult = await client.query(
      'DELETE FROM "inventory" WHERE "productId" = $1 RETURNING *',
      [id]
    )

    if (inventoryResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Estoque não encontrado" },
        { status: 404 }
      )
    }

    // Deletar o produto
    await client.query(
      'DELETE FROM "products" WHERE id = $1',
      [id]
    )

    return NextResponse.json(
      { message: "Produto e estoque excluídos com sucesso" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro ao excluir produto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
