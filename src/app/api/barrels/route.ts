import { NextRequest, NextResponse } from "next/server"

// API temporariamente desabilitada - tabela barrels não existe
export async function GET() {
  return NextResponse.json(
    { error: "Funcionalidade de barrils não disponível no momento" },
    { status: 503 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Funcionalidade de barrils não disponível no momento" },
    { status: 503 }
  )
}