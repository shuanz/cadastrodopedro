import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    } = await request.json()

    // Verificar se já existe produto com o mesmo código de barras
    if (barcode) {
      const existingProduct = await prisma.product.findUnique({
        where: { barcode },
      })

      if (existingProduct) {
        return NextResponse.json(
          { error: "Já existe um produto com este código de barras" },
          { status: 400 }
        )
      }
    }

    // Criar produto e estoque em uma transação
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          description,
          price,
          cost,
          category,
          unit,
          barcode,
        },
      })

      const inventory = await tx.inventory.create({
        data: {
          productId: product.id,
          quantity: 0,
          minQuantity,
          maxQuantity,
        },
      })

      return { product, inventory }
    })

    return NextResponse.json(
      { message: "Produto criado com sucesso", product: result.product },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar produto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
