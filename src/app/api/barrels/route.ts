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

export async function GET() {
  const client = await pool.connect()
  
  try {
    const result = await client.query(`
      SELECT b.*, 
             COUNT(p.id) as product_count,
             COUNT(t.id) as ticket_count
      FROM "barrels" b
      LEFT JOIN "products" p ON b.id = p."barrelId"
      LEFT JOIN "tickets" t ON b.id = t."barrelId"
      GROUP BY b.id
      ORDER BY b."createdAt" DESC
    `)

    const barrels = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      volumeTotalMl: row.volumeTotalMl,
      volumeDisponivelMl: row.volumeDisponivelMl,
      mlResiduoMinimo: row.mlResiduoMinimo,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      closedAt: row.closedAt,
      productCount: parseInt(row.product_count),
      ticketCount: parseInt(row.ticket_count),
      // Calcular percentual disponível
      percentualDisponivel: Math.round((row.volumeDisponivelMl / row.volumeTotalMl) * 100),
      // Verificar se está próximo do resíduo mínimo
      isLowVolume: row.volumeDisponivelMl <= row.mlResiduoMinimo
    }))

    return NextResponse.json(barrels)
  } catch (error) {
    console.error("Erro ao buscar barrils:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { name, volumeTotalMl, mlResiduoMinimo } = await request.json()

    if (!name || !volumeTotalMl) {
      return NextResponse.json(
        { error: "Nome e volume total são obrigatórios" },
        { status: 400 }
      )
    }

    if (volumeTotalMl <= 0) {
      return NextResponse.json(
        { error: "Volume total deve ser maior que zero" },
        { status: 400 }
      )
    }

    const barrelId = `barrel-${Date.now()}`
    
    const result = await client.query(`
      INSERT INTO "barrels" (id, name, "volumeTotalMl", "volumeDisponivelMl", "mlResiduoMinimo", status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      barrelId, 
      name.trim(), 
      volumeTotalMl, 
      volumeTotalMl, // Inicialmente, volume disponível = volume total
      mlResiduoMinimo || 50, 
      'ACTIVE'
    ])

    const barrel = result.rows[0]

    // Registrar movimento de entrada
    await client.query(`
      INSERT INTO "barrel_movements" (id, "barrelId", type, "volumeMl", reference, "userId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      `movement-${Date.now()}`,
      barrelId,
      'ENTRY',
      volumeTotalMl,
      'Abertura do barril',
      session.user.id
    ])

    return NextResponse.json(
      { message: "Barril criado com sucesso", barrel },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar barril:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
