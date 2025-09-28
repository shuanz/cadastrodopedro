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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()
  
  try {
    const { id } = await params
    
    const result = await client.query(`
      SELECT p.*, i.quantity, i."minQuantity", i."maxQuantity"
      FROM "Product" p
      LEFT JOIN "Inventory" i ON p.id = i."productId"
      WHERE p.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    const product = result.rows[0]
    const formattedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      cost: product.cost ? parseFloat(product.cost) : null,
      category: product.category,
      unit: product.unit,
      barcode: product.barcode,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      inventory: {
        quantity: product.quantity || 0,
        minQuantity: product.minQuantity || 0,
        maxQuantity: product.maxQuantity
      }
    }

    return NextResponse.json(formattedProduct)
  } catch (error) {
    console.error("Erro ao buscar produto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

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
      isActive,
    } = await request.json()
    const { id } = await params

    // Verificar se o produto existe
    const existingProductResult = await client.query(
      'SELECT id FROM "Product" WHERE id = $1',
      [id]
    )

    if (existingProductResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se já existe outro produto com o mesmo código de barras
    if (barcode) {
      const duplicateProductResult = await client.query(
        'SELECT id FROM "Product" WHERE barcode = $1 AND id != $2',
        [barcode, id]
      )

      if (duplicateProductResult.rows.length > 0) {
        return NextResponse.json(
          { error: "Já existe um produto com este código de barras" },
          { status: 400 }
        )
      }
    }

    // Atualizar produto e estoque em uma transação
    await client.query('BEGIN')
    
    try {
      // Atualizar produto
      await client.query(`
        UPDATE "Product" 
        SET name = $1, description = $2, price = $3, cost = $4, 
            category = $5, unit = $6, barcode = $7, "isActive" = $8, "updatedAt" = NOW()
        WHERE id = $9
      `, [name, description, price, cost, category, unit, barcode, isActive, id])

      // Atualizar estoque
      await client.query(`
        UPDATE "Inventory" 
        SET "minQuantity" = $1, "maxQuantity" = $2, "updatedAt" = NOW()
        WHERE "productId" = $3
      `, [minQuantity, maxQuantity, id])

      await client.query('COMMIT')

      // Buscar produto atualizado
      const updatedProductResult = await client.query(`
        SELECT p.*, i.quantity, i."minQuantity", i."maxQuantity"
        FROM "Product" p
        LEFT JOIN "Inventory" i ON p.id = i."productId"
        WHERE p.id = $1
      `, [id])

      const product = updatedProductResult.rows[0]
      const formattedProduct = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        cost: product.cost ? parseFloat(product.cost) : null,
        category: product.category,
        unit: product.unit,
        barcode: product.barcode,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        inventory: {
          quantity: product.quantity || 0,
          minQuantity: product.minQuantity || 0,
          maxQuantity: product.maxQuantity
        }
      }

      return NextResponse.json(
        { message: "Produto atualizado com sucesso", product: formattedProduct },
        { status: 200 }
      )
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error("Erro ao atualizar produto:", error)
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
    const existingProductResult = await client.query(
      'SELECT id FROM "Product" WHERE id = $1',
      [id]
    )

    if (existingProductResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se há vendas associadas ao produto
    const salesCountResult = await client.query(
      'SELECT COUNT(*) FROM "SaleItem" WHERE "productId" = $1',
      [id]
    )

    const salesCount = parseInt(salesCountResult.rows[0].count)

    if (salesCount > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir produto com vendas associadas" },
        { status: 400 }
      )
    }

    // Excluir produto (o estoque será excluído automaticamente por cascade)
    await client.query('DELETE FROM "Product" WHERE id = $1', [id])

    return NextResponse.json(
      { message: "Produto excluído com sucesso" },
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
