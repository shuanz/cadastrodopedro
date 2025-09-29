import { useEffect, useRef } from 'react'

interface Sale {
  id: string
  createdAt: string
  total: number
  discount?: number
  items: Array<{
    id: string
    quantity: number
    price: number
    subtotal: number
    product: {
      name: string
      category?: string
      unit?: string
      price?: number
    }
  }>
}

interface IndividualTicketPrintProps {
  sale: Sale
  onComplete: () => void
}

export default function IndividualTicketPrint({ sale, onComplete }: IndividualTicketPrintProps) {
  const hasExecuted = useRef(false)
  const executionId = useRef<string | null>(null)

  console.log("IndividualTicketPrint component mounted!", { 
    saleId: sale?.id, 
    hasExecuted: hasExecuted.current,
    executionId: executionId.current 
  })

  useEffect(() => {
    // Evitar execução múltipla para a mesma venda
    const currentSaleId = sale?.id
    if (hasExecuted.current && executionId.current === currentSaleId) {
      console.log("IndividualTicketPrint: Já executado para esta venda, ignorando...")
      return
    }
    
    hasExecuted.current = true
    executionId.current = currentSaleId

    console.log("IndividualTicketPrint iniciado!")
    console.log("Dados da venda:", sale)

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

    const generateIndividualTicketContent = (item: { product: { name: string }, quantity: number, price: number, subtotal: number }, ticketNumber: number, totalTickets: number) => {
      let ticketText = ""
      ticketText += "=".repeat(32) + "\n"
      ticketText += "        CADASTRO DO PEDRO\n"
      ticketText += "        Sistema de Vendas\n"
      ticketText += "=".repeat(32) + "\n"
      ticketText += `Ticket: #${sale.id ? sale.id.slice(-8) : 'N/A'}\n`
      ticketText += `Ficha: ${ticketNumber}/${totalTickets}\n`
      ticketText += `${formatDate(sale.createdAt)}\n`
      ticketText += "-".repeat(32) + "\n"
      ticketText += `${item.product.name}\n`
      ticketText += `1x R$ ${Number(item.price).toFixed(2)} = R$ ${Number(item.price).toFixed(2)}\n`
      ticketText += "-".repeat(32) + "\n"
      ticketText += `TOTAL: R$ ${Number(item.price).toFixed(2)}\n`
      ticketText += "=".repeat(32) + "\n"
      ticketText += "Obrigado pela preferência!\n"
      ticketText += "Volte sempre!\n"
      ticketText += "=".repeat(32) + "\n"

      return ticketText
    }

    const printIndividualTickets = async () => {
      // Calcular total de tickets (soma de todas as quantidades)
      let totalTickets = 0
      for (const item of sale.items) {
        totalTickets += item.quantity
      }
      
      let currentTicketNumber = 1
      console.log(`🚀 EXECUTANDO IMPRESSÃO EM LOTE: ${totalTickets} tickets para impressão em lote...`)

      // Concatenar todos os tickets em um único documento
      let allTicketsContent = ""
      
      for (const item of sale.items) {
        // Gerar um ticket para cada unidade deste produto
        for (let unit = 0; unit < item.quantity; unit++) {
          const ticketContent = generateIndividualTicketContent(item, currentTicketNumber, totalTickets)
          allTicketsContent += ticketContent + "\n\n" + "=".repeat(50) + "\n\n"
          
          console.log(`📄 Gerando ticket ${currentTicketNumber}/${totalTickets}: ${item.product.name} (unidade ${unit + 1})`)
          currentTicketNumber++
        }
      }

      // Criar uma nova janela para impressão
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Tickets de Venda - ${totalTickets} tickets</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.2;
                  margin: 20px;
                  padding: 0;
                  white-space: pre-line;
                }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              ${allTicketsContent}
            </body>
          </html>
        `)
        printWindow.document.close()
        
        // Aguardar carregamento e imprimir
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 500)
        }
      }
      
      console.log(`Impressão de ${totalTickets} tickets concluída!`)
      onComplete()
    }

    printIndividualTickets()
  }, [sale, onComplete])

  return null
}
