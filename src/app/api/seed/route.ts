import { NextResponse } from "next/server"
import { createPrismaClient } from "@/lib/prisma-factory"
import bcrypt from 'bcryptjs'

export async function POST() {
  const prisma = createPrismaClient()
  
  try {
    console.log('🌱 Executando seed manual...')
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA')

    // Testar conexão com o banco
    try {
      await prisma.$connect()
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
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (!existingAdmin) {
      console.log('🔐 Criando usuário admin...')
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      
      const admin = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN'
        }
      })

      console.log('✅ Usuário administrador criado:', admin.email)
    } else {
      console.log('ℹ️  Usuário administrador já existe')
    }

    // Criar alguns produtos de exemplo
    console.log('📦 Verificando produtos existentes...')
    const existingProducts = await prisma.product.count()
    
    if (existingProducts === 0) {
      console.log('📦 Criando produtos de exemplo...')
      
      const products = [
        {
          name: 'Cerveja Skol 350ml',
          description: 'Cerveja pilsen gelada',
          price: 5.50,
          cost: 3.20,
          category: 'Bebidas',
          unit: 'unidade',
          barcode: '7891234567890'
        },
        {
          name: 'Refrigerante Coca-Cola 350ml',
          description: 'Refrigerante de cola gelado',
          price: 4.50,
          cost: 2.80,
          category: 'Bebidas',
          unit: 'unidade',
          barcode: '7891234567891'
        },
        {
          name: 'Porção de Batata Frita',
          description: 'Batata frita crocante - serve 2 pessoas',
          price: 12.90,
          cost: 5.50,
          category: 'Petiscos',
          unit: 'unidade'
        },
        {
          name: 'Hambúrguer Artesanal',
          description: 'Hambúrguer com pão brioche, carne 150g, queijo e salada',
          price: 18.90,
          cost: 8.50,
          category: 'Comidas',
          unit: 'unidade'
        },
        {
          name: 'Água Mineral 500ml',
          description: 'Água mineral sem gás',
          price: 3.00,
          cost: 1.20,
          category: 'Bebidas',
          unit: 'unidade'
        }
      ]

      for (const productData of products) {
        console.log(`📦 Criando produto: ${productData.name}`)
        const product = await prisma.product.create({
          data: productData
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
    // Narrowing seguro para TypeScript
    if (error instanceof Error) {
      console.error('❌ Erro durante o seed:', error)
      console.error('❌ Stack trace:', error.stack)
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

    // Fallback para erros não-Error (string, objeto, etc.)
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
    try {
      await prisma.$disconnect()
      console.log('🔌 Conexão com banco fechada')
    } catch (disconnectError) {
      console.error('❌ Erro ao fechar conexão:', disconnectError)
    }
  }
}
