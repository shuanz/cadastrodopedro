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
      FROM "Sale" s
      LEFT JOIN users u ON s."userId" = u.id
      LEFT JOIN "SaleItem" si ON s.id = si."saleId"
      LEFT JOIN "Product" p ON si."productId" = p.id
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
               c.name as category_name, u.name as unit_name,
               b.id as barrel_id, b."volumeDisponivelMl" as barrel_volume_available
        FROM "products" p
        LEFT JOIN "inventory" i ON p.id = i."productId"
        LEFT JOIN "categories" c ON p."categoryId" = c.id
        LEFT JOIN "units" u ON p."unitId" = u.id
        LEFT JOIN "barrels" b ON p."barrelId" = b.id
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

      // Verificar estoque baseado no tipo de produto
      if (product.productType === 'FRACTIONED') {
        // Produto fracionado - verificar volume do barril
        if (!product.barrel_id) {
          return NextResponse.json(
            { error: `Produto ${product.name} não está vinculado a um barril` },
            { status: 400 }
          )
        }

        if (product.barrel_volume_available < (item.quantity * product.volumeRetiradaMl)) {
          return NextResponse.json(
            { error: `Volume insuficiente no barril para ${product.name}. Disponível: ${product.barrel_volume_available}ml, Necessário: ${item.quantity * product.volumeRetiradaMl}ml` },
            { status: 400 }
          )
        }
      } else {
        // Produto unitário - verificar estoque tradicional
        if (!product.inventory_quantity || product.inventory_quantity < item.quantity) {
          return NextResponse.json(
            { error: `Estoque insuficiente para ${product.name}` },
            { status: 400 }
          )
        }
      }

      const subtotal = item.quantity * item.price
      total += subtotal

      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal,
        volumeTotalMl: product.productType === 'FRACTIONED' ? item.quantity * product.volumeRetiradaMl : null,
        productType: product.productType,
        barrelId: product.barrel_id
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
          INSERT INTO "sale_items" (id, "saleId", "productId", quantity, price, subtotal, "volumeTotalMl", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [saleItemId, saleId, item.productId, item.quantity, item.price, item.subtotal, item.volumeTotalMl])

        createdSaleItems.push({ id: saleItemId, ...item })

        // Gerar fichas para produtos fracionados
        if (item.productType === 'FRACTIONED' && item.quantity > 0) {
          for (let i = 1; i <= item.quantity; i++) {
            const ticketId = `ticket-${Date.now()}-${Math.random()}`
            const qrCode = `${saleId}-${saleItemId}-${i}`
            
            await client.query(`
              INSERT INTO "tickets" (id, "saleItemId", "productId", "barrelId", sequence, "totalTickets", status, "qrCode", "createdAt")
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, [
              ticketId,
              saleItemId,
              item.productId,
              item.barrelId,
              i,
              item.quantity,
              'PENDING',
              qrCode
            ])
          }
        }
      }

      // Atualizar estoque baseado no tipo de produto
      for (const item of saleItems) {
        if (item.productType === 'FRACTIONED') {
          // Baixar volume do barril
          await client.query(`
            UPDATE "barrels" 
            SET "volumeDisponivelMl" = "volumeDisponivelMl" - $1, "updatedAt" = NOW()
            WHERE id = $2
          `, [item.volumeTotalMl, item.barrelId])

          // Registrar movimentação do barril
          await client.query(`
            INSERT INTO "barrel_movements" (id, "barrelId", type, "volumeMl", reference, "userId", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `, [
            `movement-${Date.now()}-${Math.random()}`,
            item.barrelId,
            'SALE',
            item.volumeTotalMl,
            `Venda ${saleId}`,
            session.user.id
          ])
        } else {
          // Baixar estoque tradicional
          await client.query(`
            UPDATE "inventory" 
            SET quantity = quantity - $1, "updatedAt" = NOW()
            WHERE "productId" = $2
          `, [item.quantity, item.productId])
        }
      }

      await client.query('COMMIT')

      // Buscar a venda completa com fichas
      const completeSaleResult = await client.query(`
        SELECT s.*, u.name as user_name,
               si.id as item_id, si."productId", si.quantity as item_quantity, 
               si.price as item_price, si.subtotal, si."volumeTotalMl",
               p.name as product_name, p."productType", p."volumeRetiradaMl",
               c.name as category_name, u2.name as unit_name,
               b.name as barrel_name
        FROM "sales" s
        LEFT JOIN users u ON s."userId" = u.id
        LEFT JOIN "sale_items" si ON s.id = si."saleId"
        LEFT JOIN "products" p ON si."productId" = p.id
        LEFT JOIN "categories" c ON p."categoryId" = c.id
        LEFT JOIN "units" u2 ON p."unitId" = u2.id
        LEFT JOIN "barrels" b ON p."barrelId" = b.id
        WHERE s.id = $1
      `, [saleId])

      // Buscar fichas geradas
      const ticketsResult = await client.query(`
        SELECT t.*, p.name as product_name, p."volumeRetiradaMl"
        FROM "tickets" t
        LEFT JOIN "products" p ON t."productId" = p.id
        WHERE t."saleItemId" IN (
          SELECT id FROM "sale_items" WHERE "saleId" = $1
        )
        ORDER BY t."saleItemId", t.sequence
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
          volumeTotalMl: row.volumeTotalMl,
          product: {
            name: row.product_name,
            productType: row.productType,
            volumeRetiradaMl: row.volumeRetiradaMl,
            category: row.category_name,
            unit: row.unit_name,
            barrelName: row.barrel_name
          }
        })),
        tickets: ticketsResult.rows.map(ticket => ({
          id: ticket.id,
          saleItemId: ticket.saleItemId,
          productId: ticket.productId,
          barrelId: ticket.barrelId,
          sequence: ticket.sequence,
          totalTickets: ticket.totalTickets,
          status: ticket.status,
          qrCode: ticket.qrCode,
          createdAt: ticket.createdAt,
          product: {
            name: ticket.product_name,
            volumeRetiradaMl: ticket.volumeRetiradaMl
          }
        }))
      }

      console.log("Venda completa retornada:", completeSale)

      return NextResponse.json(
        { 
          message: "Venda realizada com sucesso", 
          sale: completeSale,
          ticketsGenerated: ticketsResult.rows.length
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
