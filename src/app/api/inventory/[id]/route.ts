import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { quantity } = await request.json()
    const { id } = await params

    if (quantity < 0) {
      return NextResponse.json(
        { error: "Quantidade não pode ser negativa" },
        { status: 400 }
      )
    }

    const inventory = await prisma.inventory.update({
      where: { productId: id },
      data: {
        quantity,
        lastUpdated: new Date(),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unit: true,
            price: true,
            isActive: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: "Estoque atualizado com sucesso", inventory },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
