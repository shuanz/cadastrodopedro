import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { name, email, password, role } = await request.json()
    const { id } = await params

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se já existe outro usuário com o mesmo email
    if (email !== existingUser.email) {
      const duplicateUser = await prisma.user.findUnique({
        where: { email }
      })

      if (duplicateUser) {
        return NextResponse.json(
          { error: "Já existe um usuário com este email" },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const updateData: {
      name: string
      email: string
      role: "ADMIN" | "USER"
      password?: string
    } = {
      name,
      email,
      role: role as "ADMIN" | "USER",
    }

    // Se uma nova senha foi fornecida, criptografá-la
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Atualizar o usuário
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { message: "Usuário atualizado com sucesso", user },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
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
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { id } = await params
    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Impedir que o usuário exclua a si mesmo
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Você não pode excluir sua própria conta" },
        { status: 400 }
      )
    }

    // Verificar se há vendas associadas ao usuário
    const salesCount = await prisma.sale.count({
      where: { userId: id }
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir usuário com vendas associadas" },
        { status: 400 }
      )
    }

    // Excluir o usuário
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: "Usuário excluído com sucesso" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro ao excluir usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
