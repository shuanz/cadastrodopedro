import { NextRequest, NextResponse } from "next/server"

// API temporariamente desabilitada - tabela barrels não existe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Funcionalidade de barrils não disponível no momento" },
    { status: 503 }
  )
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Funcionalidade de barrils não disponível no momento" },
    { status: 503 }
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Funcionalidade de barrils não disponível no momento" },
    { status: 503 }
  )
}