import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma-client"

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error("Erro ao buscar vendas:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    }> = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { inventory: true },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Produto ${item.productId} não encontrado` },
          { status: 400 }
        )
      }

      if (!product.isActive) {
        return NextResponse.json(
          { error: `Produto ${product.name} está inativo` },
          { status: 400 }
        )
      }

      if (!product.inventory || product.inventory.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente para ${product.name}` },
          { status: 400 }
        )
      }

      const subtotal = item.quantity * item.price
      total += subtotal

      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal,
      })
    }

    const finalTotal = total - (discount || 0)

    // Criar venda e atualizar estoque em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar a venda
      const sale = await tx.sale.create({
        data: {
          userId: session.user.id,
          total: finalTotal,
          discount: discount || 0,
          paymentMethod,
          status: "COMPLETED",
        },
      })

      // Criar os itens da venda
      await tx.saleItem.createMany({
        data: saleItems.map(item => ({
          saleId: sale.id,
          ...item,
        })),
      })

      // Atualizar estoque
      for (const item of saleItems) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
            lastUpdated: new Date(),
          },
        })
      }

      return sale
    })

    // Buscar a venda completa com todos os dados para retornar
    const completeSale = await prisma.sale.findUnique({
      where: { id: result.id },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    })

    console.log("Venda completa retornada:", completeSale)

    return NextResponse.json(
      { message: "Venda realizada com sucesso", sale: completeSale },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao processar venda:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
