"use client"

import { useEffect, useRef } from "react"

interface Ticket {
  id: string
  saleItemId: string
  productId: string
  barrelId?: string
  sequence: number
  totalTickets: number
  status: string
  qrCode?: string
  createdAt: string
  product: {
    name: string
    volumeRetiradaMl: number
  }
}

interface Sale {
  id: string
  total: number
  discount: number
  createdAt: string
  user: {
    name: string
  }
}

interface FractionedTicketPrintProps {
  sale: Sale
  tickets: Ticket[]
  onComplete: () => void
}

export default function FractionedTicketPrint({ sale, tickets, onComplete }: FractionedTicketPrintProps) {
  const hasExecuted = useRef(false)

  useEffect(() => {
    if (hasExecuted.current) return
    hasExecuted.current = true

    const formatDate = (dateString: string) => {
      if (!dateString) return 'Data não disponível'
      const date = new Date(dateString)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const generateTicketContent = (ticket: Ticket) => {
      let ticketText = ""
      ticketText += "=".repeat(32) + "\n"
      ticketText += "        CADASTRO DO PEDRO\n"
      ticketText += "        Sistema de Vendas\n"
      ticketText += "=".repeat(32) + "\n"
      ticketText += `Pedido: #${sale.id ? sale.id.slice(-8) : 'N/A'}\n`
      ticketText += `Ficha: ${ticket.sequence}/${ticket.totalTickets}\n`
      ticketText += `${formatDate(sale.createdAt)}\n`
      ticketText += "-".repeat(32) + "\n"
      ticketText += `Produto: ${ticket.product.name}\n`
      ticketText += `Volume: ${ticket.product.volumeRetiradaMl}ml\n`
      ticketText += `Preço: R$ ${(sale.total / tickets.length).toFixed(2)}\n`
      ticketText += "-".repeat(32) + "\n"
      ticketText += `QR Code: ${ticket.qrCode || 'N/A'}\n`
      ticketText += "-".repeat(32) + "\n"
      ticketText += "Apresente esta ficha no balcão\n"
      ticketText += "para retirar seu produto.\n"
      ticketText += "=".repeat(32) + "\n"
      ticketText += "Obrigado pela preferência!\n"
      ticketText += "Volte sempre!\n"
      ticketText += "=".repeat(32) + "\n"
      return ticketText
    }

    const printTickets = async () => {
      console.log(`🖨️ Iniciando impressão de ${tickets.length} fichas...`)

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i]
        const ticketContent = generateTicketContent(ticket)
        
        console.log(`🖨️ Imprimindo ficha ${i + 1}/${tickets.length}: ${ticket.product.name}`)

        // Criar iframe para impressão
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        
        const iframeDoc = iframe.contentWindow?.document
        if (iframeDoc) {
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Ficha ${ticket.sequence}/${ticket.totalTickets}</title>
                <style>
                  body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    margin: 0;
                    padding: 20px;
                    white-space: pre-line;
                  }
                  @page { 
                    margin: 0; 
                    size: 80mm 200mm; 
                  }
                </style>
              </head>
              <body>
                ${ticketContent}
              </body>
            </html>
          `)
          iframeDoc.close()
          
          // Aguardar carregamento e imprimir
          await new Promise<void>((resolve) => {
            iframe.onload = () => {
              setTimeout(() => {
                try {
                  iframe.contentWindow?.print()
                  setTimeout(() => {
                    document.body.removeChild(iframe)
                    resolve()
                  }, 1000)
                } catch (error) {
                  console.error('Erro ao imprimir ficha:', error)
                  document.body.removeChild(iframe)
                  resolve()
                }
              }, 500)
            }
          })
        }

        // Pequena pausa entre impressões
        if (i < tickets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      console.log('✅ Impressão de fichas concluída!')
      onComplete()
    }

    printTickets()

  }, [sale, tickets, onComplete])

  return null
}
