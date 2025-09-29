import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Criar usuário administrador padrão
  const adminEmail = 'admin@cadastrodopedro.com'
  const adminPassword = 'admin123'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log('✅ Usuário administrador criado:')
    console.log(`   Email: ${admin.email}`)
    console.log(`   Senha: ${adminPassword}`)
    console.log('   ⚠️  LEMBRE-SE DE ALTERAR A SENHA APÓS O PRIMEIRO LOGIN!')
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
    const existingCategory = await prisma.category.findUnique({
      where: { name: categoryData.name }
    })

    if (!existingCategory) {
      const category = await prisma.category.create({
        data: categoryData
      })
      createdCategories[categoryData.name] = category.id
      console.log(`✅ Categoria criada: ${category.name}`)
    } else {
      createdCategories[categoryData.name] = existingCategory.id
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
    const existingUnit = await prisma.unit.findUnique({
      where: { name: unitData.name }
    })

    if (!existingUnit) {
      const unit = await prisma.unit.create({
        data: unitData
      })
      createdUnits[unitData.name] = unit.id
      console.log(`✅ Unidade criada: ${unit.name} (${unit.symbol})`)
    } else {
      createdUnits[unitData.name] = existingUnit.id
      console.log(`ℹ️  Unidade já existe: ${unitData.name}`)
    }
  }

  // Criar alguns produtos de exemplo
    const existingProducts = await prisma.product.count()
  
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
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          cost: productData.cost,
          categoryId: createdCategories[productData.categoryName],
          unitId: createdUnits[productData.unitName],
          barcode: productData.barcode
        }
      })

      // Criar estoque inicial
      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: Math.floor(Math.random() * 50) + 10, // Entre 10 e 60
          minQuantity: 5,
          maxQuantity: 100
        }
      })
    }

    console.log(`✅ ${products.length} produtos de exemplo criados com estoque inicial`)
  } else {
    console.log('ℹ️  Produtos já existem no banco de dados')
  }

  console.log('🎉 Seeding concluído!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
