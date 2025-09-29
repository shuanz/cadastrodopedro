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
      SELECT s.*, u.name as user_name,
             si.id as item_id, si."productId", si.quantity as item_quantity, 
             si.price as item_price, si.subtotal,
             p.name as product_name, p.unit as product_unit
      FROM "sales" s
      LEFT JOIN users u ON s."userId" = u.id
      LEFT JOIN "sale_items" si ON s.id = si."saleId"
      LEFT JOIN "products" p ON si."productId" = p.id
      ORDER BY s."createdAt" DESC
    `)

    // Agrupar vendas e itens
    const salesMap = new Map()
    
    result.rows.forEach(row => {
      if (!salesMap.has(row.id)) {
        salesMap.set(row.id, {
          id: row.id,
          userId: row.userId,
          total: parseFloat(row.total),
          discount: parseFloat(row.discount),
          paymentMethod: row.paymentMethod,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          user: { name: row.user_name },
          items: []
        })
      }
      
      if (row.item_id) {
        salesMap.get(row.id).items.push({
          id: row.item_id,
          saleId: row.id,
          productId: row.productId,
          quantity: row.item_quantity,
          price: parseFloat(row.item_price),
          subtotal: parseFloat(row.subtotal),
          product: {
            name: row.product_name,
            unit: row.product_unit
          }
        })
      }
    })

    const sales = Array.from(salesMap.values())
    return NextResponse.json(sales)
  } catch (error) {
    console.error("Erro ao buscar vendas:", error)
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
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { items, paymentMethod, discount } = await request.json()
    
    console.log("Dados recebidos na API:", { items, paymentMethod, discount })

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Nenhum item na venda" },
        { status: 400 }
      )
    }

    // Verificar estoque e calcular total
    let total = 0
    const saleItems: Array<{
      productId: string
      quantity: number
      price: number
      subtotal: number
      volumeTotalMl?: number
      productType?: string
      barrelId?: string
    }> = []

    for (const item of items) {
      const productResult = await client.query(`
        SELECT p.*, i.quantity as inventory_quantity,
               c.name as category_name, u.name as unit_name
        FROM "products" p
        LEFT JOIN "inventory" i ON p.id = i."productId"
        LEFT JOIN "categories" c ON p.category = c.name
        LEFT JOIN "units" u ON p.unit = u.name
        WHERE p.id = $1
      `, [item.productId])

      if (productResult.rows.length === 0) {
        return NextResponse.json(
          { error: `Produto ${item.productId} não encontrado` },
          { status: 400 }
        )
      }

      const product = productResult.rows[0]

      if (!product.isActive) {
        return NextResponse.json(
          { error: `Produto ${product.name} está inativo` },
          { status: 400 }
        )
      }

      // Verificar estoque (apenas produtos unitários por enquanto)
      if (!product.inventory_quantity || product.inventory_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente para ${product.name}. Disponível: ${product.inventory_quantity || 0}, Solicitado: ${item.quantity}` },
          { status: 400 }
        )
      }

      const subtotal = item.quantity * item.price
      total += subtotal

      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal
      })
    }

    const finalTotal = total - (discount || 0)

    // Criar venda e atualizar estoque em uma transação
    await client.query('BEGIN')
    
    try {
      const saleId = `sale-${Date.now()}`
      
      // Criar a venda
      await client.query(`
        INSERT INTO "sales" (id, "userId", total, discount, "paymentMethod", status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [saleId, session.user.id, finalTotal, discount || 0, paymentMethod, 'COMPLETED'])

      // Criar os itens da venda e gerar fichas
      const createdSaleItems = []
      for (const item of saleItems) {
        const saleItemId = `saleitem-${Date.now()}-${Math.random()}`
        
        await client.query(`
          INSERT INTO "sale_items" (id, "saleId", "productId", quantity, price, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [saleItemId, saleId, item.productId, item.quantity, item.price, item.subtotal])

        createdSaleItems.push({ id: saleItemId, ...item })
      }

      // Atualizar estoque (apenas produtos unitários)
      for (const item of saleItems) {
        await client.query(`
          UPDATE "inventory" 
          SET quantity = quantity - $1, "lastUpdated" = NOW()
          WHERE "productId" = $2
        `, [item.quantity, item.productId])
      }

      await client.query('COMMIT')

      // Buscar a venda completa
      const completeSaleResult = await client.query(`
        SELECT s.*, u.name as user_name,
               si.id as item_id, si."productId", si.quantity as item_quantity, 
               si.price as item_price, si.subtotal,
               p.name as product_name, p."productType", p."volumeRetiradaMl",
               c.name as category_name, u2.name as unit_name
        FROM "sales" s
        LEFT JOIN users u ON s."userId" = u.id
        LEFT JOIN "sale_items" si ON s.id = si."saleId"
        LEFT JOIN "products" p ON si."productId" = p.id
        LEFT JOIN "categories" c ON p.category = c.name
        LEFT JOIN "units" u2 ON p.unit = u2.name
        WHERE s.id = $1
      `, [saleId])


      // Montar resposta
      const saleData = completeSaleResult.rows[0]
      const completeSale = {
        id: saleData.id,
        userId: saleData.userId,
        total: parseFloat(saleData.total),
        discount: parseFloat(saleData.discount),
        paymentMethod: saleData.paymentMethod,
        status: saleData.status,
        createdAt: saleData.createdAt,
        updatedAt: saleData.updatedAt,
        user: { name: saleData.user_name },
        items: completeSaleResult.rows.map(row => ({
          id: row.item_id,
          saleId: row.id,
          productId: row.productId,
          quantity: row.item_quantity,
          price: parseFloat(row.item_price),
          subtotal: parseFloat(row.subtotal),
          product: {
            name: row.product_name,
            productType: row.productType,
            volumeRetiradaMl: row.volumeRetiradaMl,
            category: row.category_name,
            unit: row.unit_name
          }
        }))
      }

      console.log("Venda completa retornada:", completeSale)

      return NextResponse.json(
        { 
          message: "Venda realizada com sucesso", 
          sale: completeSale,
          ticketsGenerated: 0
        },
        { status: 201 }
      )
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error("Erro ao processar venda:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
