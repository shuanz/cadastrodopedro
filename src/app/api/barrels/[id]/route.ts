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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()
  
  try {
    const { id } = await params
    
    const result = await client.query(`
      SELECT b.*, 
             COUNT(p.id) as product_count,
             COUNT(t.id) as ticket_count
      FROM "barrels" b
      LEFT JOIN "products" p ON b.id = p."barrelId"
      LEFT JOIN "tickets" t ON b.id = t."barrelId"
      WHERE b.id = $1
      GROUP BY b.id
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Barril não encontrado" },
        { status: 404 }
      )
    }

    const barrel = result.rows[0]
    
    // Buscar movimentações do barril
    const movementsResult = await client.query(`
      SELECT bm.*, u.name as user_name
      FROM "barrel_movements" bm
      LEFT JOIN users u ON bm."userId" = u.id
      WHERE bm."barrelId" = $1
      ORDER BY bm."createdAt" DESC
    `, [id])

    // Buscar produtos vinculados
    const productsResult = await client.query(`
      SELECT p.id, p.name, p."volumeRetiradaMl", p.price, p."isActive"
      FROM "products" p
      WHERE p."barrelId" = $1
      ORDER BY p.name
    `, [id])

    const formattedBarrel = {
      id: barrel.id,
      name: barrel.name,
      volumeTotalMl: barrel.volumeTotalMl,
      volumeDisponivelMl: barrel.volumeDisponivelMl,
      mlResiduoMinimo: barrel.mlResiduoMinimo,
      status: barrel.status,
      createdAt: barrel.createdAt,
      updatedAt: barrel.updatedAt,
      closedAt: barrel.closedAt,
      productCount: parseInt(barrel.product_count),
      ticketCount: parseInt(barrel.ticket_count),
      percentualDisponivel: Math.round((barrel.volumeDisponivelMl / barrel.volumeTotalMl) * 100),
      isLowVolume: barrel.volumeDisponivelMl <= barrel.mlResiduoMinimo,
      movements: movementsResult.rows,
      products: productsResult.rows
    }

    return NextResponse.json(formattedBarrel)
  } catch (error) {
    console.error("Erro ao buscar barril:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()
  
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const { name, mlResiduoMinimo, status } = await request.json()

    // Verificar se o barril existe
    const existingBarrel = await client.query(
      'SELECT * FROM "barrels" WHERE id = $1',
      [id]
    )

    if (existingBarrel.rows.length === 0) {
      return NextResponse.json(
        { error: "Barril não encontrado" },
        { status: 404 }
      )
    }

    const currentBarrel = existingBarrel.rows[0]

    // Se está encerrando o barril
    if (status === 'CLOSED' && currentBarrel.status !== 'CLOSED') {
      await client.query('BEGIN')
      
      try {
        // Atualizar barril
        const result = await client.query(`
          UPDATE "barrels" 
          SET name = $1, "mlResiduoMinimo" = $2, status = $3, "closedAt" = NOW(), "updatedAt" = NOW()
          WHERE id = $4
          RETURNING *
        `, [
          name || currentBarrel.name,
          mlResiduoMinimo || currentBarrel.mlResiduoMinimo,
          status,
          id
        ])

        // Registrar movimento de encerramento
        await client.query(`
          INSERT INTO "barrel_movements" (id, "barrelId", type, "volumeMl", reference, "userId", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          `movement-${Date.now()}`,
          id,
          'CLOSURE',
          0,
          `Encerramento do barril - Volume restante: ${currentBarrel.volumeDisponivelMl}ml`,
          session.user.id
        ])

        await client.query('COMMIT')

        return NextResponse.json(
          { message: "Barril encerrado com sucesso", barrel: result.rows[0] }
        )
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    } else {
      // Atualização normal
      const result = await client.query(`
        UPDATE "barrels" 
        SET name = $1, "mlResiduoMinimo" = $2, "updatedAt" = NOW()
        WHERE id = $3
        RETURNING *
      `, [
        name || currentBarrel.name,
        mlResiduoMinimo || currentBarrel.mlResiduoMinimo,
        id
      ])

      return NextResponse.json(
        { message: "Barril atualizado com sucesso", barrel: result.rows[0] }
      )
    }
  } catch (error) {
    console.error("Erro ao atualizar barril:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()
  
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar se o barril existe
    const existingBarrel = await client.query(
      'SELECT * FROM "barrels" WHERE id = $1',
      [id]
    )

    if (existingBarrel.rows.length === 0) {
      return NextResponse.json(
        { error: "Barril não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se há produtos vinculados
    const productsCount = await client.query(
      'SELECT COUNT(*) FROM "products" WHERE "barrelId" = $1',
      [id]
    )

    if (parseInt(productsCount.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir barril com produtos vinculados" },
        { status: 400 }
      )
    }

    // Verificar se há tickets
    const ticketsCount = await client.query(
      'SELECT COUNT(*) FROM "tickets" WHERE "barrelId" = $1',
      [id]
    )

    if (parseInt(ticketsCount.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir barril com tickets gerados" },
        { status: 400 }
      )
    }

    await client.query('DELETE FROM "barrels" WHERE id = $1', [id])

    return NextResponse.json(
      { message: "Barril excluído com sucesso" }
    )
  } catch (error) {
    console.error("Erro ao excluir barril:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
