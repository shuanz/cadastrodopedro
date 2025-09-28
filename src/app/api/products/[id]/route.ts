import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma-client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventory: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Erro ao buscar produto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

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
      isActive,
    } = await request.json()
    const { id } = await params

    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se já existe outro produto com o mesmo código de barras
    if (barcode && barcode !== existingProduct.barcode) {
      const duplicateProduct = await prisma.product.findUnique({
        where: { barcode },
      })

      if (duplicateProduct) {
        return NextResponse.json(
          { error: "Já existe um produto com este código de barras" },
          { status: 400 }
        )
      }
    }

    // Atualizar produto e estoque em uma transação
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          name,
          description,
          price,
          cost,
          category,
          unit,
          barcode,
          isActive,
        },
      })

      await tx.inventory.update({
        where: { productId: id },
        data: {
          minQuantity,
          maxQuantity,
        },
      })

      return product
    })

    return NextResponse.json(
      { message: "Produto atualizado com sucesso", product: result },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro ao atualizar produto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { id } = await params
    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se há vendas associadas ao produto
    const salesCount = await prisma.saleItem.count({
      where: { productId: id },
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir produto com vendas associadas" },
        { status: 400 }
      )
    }

    // Excluir produto (o estoque será excluído automaticamente por cascade)
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Produto excluído com sucesso" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro ao excluir produto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
