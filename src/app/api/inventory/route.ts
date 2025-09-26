import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
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
      orderBy: {
        product: {
          name: "asc",
        },
      },
    })

    return NextResponse.json(inventory)
  } catch (error) {
    console.error("Erro ao buscar estoque:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
