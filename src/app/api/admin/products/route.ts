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
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const result = await client.query(`
      SELECT p.id, p.name, p.category, p.unit, p.price, p."isActive", 
             i.quantity, i."minQuantity", i."maxQuantity"
      FROM products p
      LEFT JOIN inventory i ON p.id = i."productId"
      ORDER BY p.name
    `)

    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      unit: row.unit,
      price: parseFloat(row.price),
      isActive: row.isActive,
      inventory: {
        quantity: row.quantity || 0,
        minQuantity: row.minQuantity || 0,
        maxQuantity: row.maxQuantity
      }
    }))

    return NextResponse.json({
      success: true,
      products,
      total: products.length
    })
  } catch (error) {
    console.error("Erro ao listar produtos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

export async function DELETE(request: NextRequest) {
  const client = await pool.connect()
  
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: "ID do produto é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o produto existe
    const productCheck = await client.query(
      'SELECT name FROM products WHERE id = $1',
      [productId]
    )

    if (productCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    const productName = productCheck.rows[0].name

    // Verificar se há vendas associadas
    const salesCheck = await client.query(
      'SELECT COUNT(*) as count FROM sale_items WHERE "productId" = $1',
      [productId]
    )

    const salesCount = parseInt(salesCheck.rows[0].count)
    if (salesCount > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir. Produto tem ${salesCount} venda(s) associada(s).` },
        { status: 400 }
      )
    }

    // Deletar estoque
    const inventoryResult = await client.query(
      'DELETE FROM inventory WHERE "productId" = $1 RETURNING *',
      [productId]
    )

    // Deletar produto
    await client.query('DELETE FROM products WHERE id = $1', [productId])

    return NextResponse.json({
      success: true,
      message: `Produto "${productName}" deletado com sucesso!`,
      deletedInventory: inventoryResult.rows.length > 0
    })
  } catch (error) {
    console.error("Erro ao deletar produto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
