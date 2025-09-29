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
      SELECT p.*, i.quantity, i."minQuantity", i."maxQuantity",
             c.name as category_name, u.name as unit_name, u.symbol as unit_symbol,
             b.name as barrel_name, b."volumeDisponivelMl" as barrel_volume_available
      FROM "products" p
      LEFT JOIN "inventory" i ON p.id = i."productId"
      LEFT JOIN "categories" c ON p.category = c.name
      LEFT JOIN "units" u ON p.unit = u.name
      LEFT JOIN "barrels" b ON p."barrelId" = b.id
      ORDER BY p."createdAt" DESC
    `)

    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      cost: row.cost ? parseFloat(row.cost) : null,
      category: row.category_name,
      unit: row.unit_name,
      barcode: row.barcode,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      // Campos para produtos fracionados
      productType: row.productType || 'UNIT',
      volumeRetiradaMl: row.volumeRetiradaMl,
      barrelId: row.barrelId,
      barrelName: row.barrel_name,
      barrelVolumeAvailable: row.barrel_volume_available,
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
      productType,
      volumeRetiradaMl,
      barrelId,
    } = await request.json()

    // Validações para produtos fracionados
    if (productType === 'FRACTIONED') {
      if (!volumeRetiradaMl || volumeRetiradaMl <= 0) {
        return NextResponse.json(
          { error: "Volume de retirada é obrigatório para produtos fracionados" },
          { status: 400 }
        )
      }
      
      if (!barrelId) {
        return NextResponse.json(
          { error: "Barril é obrigatório para produtos fracionados" },
          { status: 400 }
        )
      }

      // Verificar se o barril existe e está ativo
      const barrelResult = await client.query(
        'SELECT id, status FROM "barrels" WHERE id = $1',
        [barrelId]
      )

      if (barrelResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Barril não encontrado" },
          { status: 400 }
        )
      }

      if (barrelResult.rows[0].status !== 'ACTIVE') {
        return NextResponse.json(
          { error: "Barril deve estar ativo para vincular produtos" },
          { status: 400 }
        )
      }
    }

    // Verificar se já existe produto com o mesmo código de barras
    if (barcode) {
      const existingProduct = await client.query(
        'SELECT id FROM "products" WHERE barcode = $1',
        [barcode]
      )

      if (existingProduct.rows.length > 0) {
        return NextResponse.json(
          { error: "Já existe um produto com este código de barras" },
          { status: 400 }
        )
      }
    }

    // Verificar se categoria e unidade existem
    const categoryResult = await client.query(
      'SELECT name FROM "categories" WHERE name = $1',
      [category]
    )
    
    const unitResult = await client.query(
      'SELECT name FROM "units" WHERE name = $1',
      [unit]
    )

    if (categoryResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 400 }
      )
    }

    if (unitResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Unidade não encontrada" },
        { status: 400 }
      )
    }

    // Criar produto e estoque em uma transação
    await client.query('BEGIN')
    
    try {
      const productResult = await client.query(`
        INSERT INTO "products" (id, name, description, price, cost, category, unit, barcode, "isActive", "productType", "volumeRetiradaMl", "barrelId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
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
        true,
        productType || 'UNIT',
        volumeRetiradaMl,
        barrelId
      ])

      const product = productResult.rows[0]

      // Criar estoque apenas para produtos unitários
      if (productType !== 'FRACTIONED') {
        await client.query(`
          INSERT INTO "inventory" (id, "productId", quantity, "minQuantity", "maxQuantity", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [
          `inventory-${Date.now()}`,
          product.id,
          0,
          minQuantity,
          maxQuantity
        ])
      }

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
