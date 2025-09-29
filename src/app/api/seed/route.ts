import { NextResponse } from "next/server"
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function POST() {
  const client = await pool.connect()
  try {
    console.log('🌱 Executando seed manual...')
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA')

    // Testar conexão com o banco
    try {
      await client.query('SELECT 1')
      console.log('✅ Conexão com banco estabelecida')
    } catch (dbError) {
      console.error('❌ Erro de conexão com banco:', dbError)
      return NextResponse.json(
        { success: false, error: 'Erro de conexão com banco de dados', details: dbError },
        { status: 500 }
      )
    }

    // Criar usuário administrador padrão
    const adminEmail = 'admin@cadastrodopedro.com'
    const adminPassword = 'admin123'

    console.log('👤 Verificando usuário admin existente...')
    const existingAdminResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    )

    if (existingAdminResult.rows.length === 0) {
      console.log('🔐 Criando usuário admin...')
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      
      const adminResult = await client.query(
        `INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, email, name, role`,
        [`user-${Date.now()}`, 'Administrador', adminEmail, hashedPassword, 'ADMIN']
      )

      const admin = adminResult.rows[0]
      console.log('✅ Usuário administrador criado:', admin.email)
    } else {
      console.log('ℹ️  Usuário administrador já existe')
    }

    // Criar categorias padrão
    console.log('📂 Criando categorias padrão...')
    const categories = [
      { name: 'Bebidas', description: 'Bebidas em geral' },
      { name: 'Comidas', description: 'Alimentos e comidas' },
      { name: 'Petiscos', description: 'Petiscos e aperitivos' },
      { name: 'Limpeza', description: 'Produtos de limpeza' }
    ]

    const createdCategories: { [key: string]: string } = {}

    for (const categoryData of categories) {
      const existingCategoryResult = await client.query(
        'SELECT id FROM "categories" WHERE name = $1',
        [categoryData.name]
      )

      if (existingCategoryResult.rows.length === 0) {
        const categoryId = `category-${Date.now()}-${Math.random()}`
        await client.query(
          `INSERT INTO "categories" (id, name, description, "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [categoryId, categoryData.name, categoryData.description, true]
        )
        createdCategories[categoryData.name] = categoryId
        console.log(`✅ Categoria criada: ${categoryData.name}`)
      } else {
        createdCategories[categoryData.name] = existingCategoryResult.rows[0].id
        console.log(`ℹ️  Categoria já existe: ${categoryData.name}`)
      }
    }

    // Criar unidades padrão
    console.log('📏 Criando unidades padrão...')
    const units = [
      { name: 'Unidade', symbol: 'un', description: 'Unidade individual' },
      { name: 'Litro', symbol: 'L', description: 'Medida de volume' },
      { name: 'Quilograma', symbol: 'kg', description: 'Medida de peso' },
      { name: 'Grama', symbol: 'g', description: 'Medida de peso em gramas' }
    ]

    const createdUnits: { [key: string]: string } = {}

    for (const unitData of units) {
      const existingUnitResult = await client.query(
        'SELECT id FROM "units" WHERE name = $1',
        [unitData.name]
      )

      if (existingUnitResult.rows.length === 0) {
        const unitId = `unit-${Date.now()}-${Math.random()}`
        await client.query(
          `INSERT INTO "units" (id, name, symbol, description, "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [unitId, unitData.name, unitData.symbol, unitData.description, true]
        )
        createdUnits[unitData.name] = unitId
        console.log(`✅ Unidade criada: ${unitData.name} (${unitData.symbol})`)
      } else {
        createdUnits[unitData.name] = existingUnitResult.rows[0].id
        console.log(`ℹ️  Unidade já existe: ${unitData.name}`)
      }
    }

    // Criar alguns produtos de exemplo
    console.log('📦 Verificando produtos existentes...')
    const existingProductsResult = await client.query('SELECT COUNT(*) FROM "products"')
    const existingProducts = parseInt(existingProductsResult.rows[0].count)
    
    if (existingProducts === 0) {
      console.log('📦 Criando produtos de exemplo...')
      
      const products = [
        {
          name: 'Cerveja Skol 350ml',
          description: 'Cerveja pilsen gelada',
          price: 5.50,
          cost: 3.20,
          categoryName: 'Bebidas',
          unitName: 'Unidade',
          barcode: '7891234567890'
        },
        {
          name: 'Refrigerante Coca-Cola 350ml',
          description: 'Refrigerante de cola gelado',
          price: 4.50,
          cost: 2.80,
          categoryName: 'Bebidas',
          unitName: 'Unidade',
          barcode: '7891234567891'
        },
        {
          name: 'Porção de Batata Frita',
          description: 'Batata frita crocante - serve 2 pessoas',
          price: 12.90,
          cost: 5.50,
          categoryName: 'Petiscos',
          unitName: 'Unidade'
        },
        {
          name: 'Hambúrguer Artesanal',
          description: 'Hambúrguer com pão brioche, carne 150g, queijo e salada',
          price: 18.90,
          cost: 8.50,
          categoryName: 'Comidas',
          unitName: 'Unidade'
        },
        {
          name: 'Água Mineral 500ml',
          description: 'Água mineral sem gás',
          price: 3.00,
          cost: 1.20,
          categoryName: 'Bebidas',
          unitName: 'Unidade'
        }
      ]

      for (const productData of products) {
        console.log(`📦 Criando produto: ${productData.name}`)
        const productId = `product-${Date.now()}-${Math.random()}`
        
        await client.query(
          `INSERT INTO "products" (id, name, description, price, cost, category, unit, barcode, "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [
            productId,
            productData.name,
            productData.description,
            productData.price,
            productData.cost,
            createdCategories[productData.categoryName],
            createdUnits[productData.unitName],
            productData.barcode,
            true
          ]
        )

        // Criar estoque inicial
        const inventoryId = `inventory-${Date.now()}-${Math.random()}`
        await client.query(
          `INSERT INTO "inventory" (id, "productId", quantity, "minQuantity", "maxQuantity", "lastUpdated")
          VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            inventoryId,
            productId,
            Math.floor(Math.random() * 50) + 10, // Entre 10 e 60
            5,
            100
          ]
        )
      }

      console.log(`✅ ${products.length} produtos de exemplo criados com estoque inicial`)
    } else {
      console.log('ℹ️  Produtos já existem no banco de dados')
    }

    console.log('🎉 Seed concluído com sucesso!')
    return NextResponse.json({ 
      success: true, 
      message: 'Seed executado com sucesso!',
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    })

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Erro durante o seed:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro durante o seed',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      )
    }

    console.error('❌ Erro durante o seed (tipo desconhecido):', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro durante o seed',
        details: String(error)
      },
      { status: 500 }
    )
  } finally {
    client.release()
    console.log('🔌 Conexão com banco fechada')
  }
}
