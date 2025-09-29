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

  console.log("IndividualTicketPrint component mounted!", { sale, hasExecuted: hasExecuted.current })

  useEffect(() => {
    if (hasExecuted.current) return
    hasExecuted.current = true

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
      console.log(`Gerando ${totalTickets} tickets para impressão em lote...`)

      // Concatenar todos os tickets em um único documento com quebras de página
      let allTicketsHTML = ""
      
      for (const item of sale.items) {
        // Gerar um ticket para cada unidade deste produto
        for (let unit = 0; unit < item.quantity; unit++) {
          const ticketContent = generateIndividualTicketContent(item, currentTicketNumber, totalTickets)
          
          // Criar uma div para cada ticket com quebra de página
          const isLastTicket = currentTicketNumber === totalTickets
          const pageBreakClass = isLastTicket ? "" : "ticket-page"
          
          allTicketsHTML += `
            <div class="ticket ${pageBreakClass}">
              <pre>${ticketContent}</pre>
            </div>
          `
          
          console.log(`Gerando ticket ${currentTicketNumber}/${totalTickets}: ${item.product.name} (unidade ${unit + 1})`)
          currentTicketNumber++
        }
      }

      // Criar um único iframe para imprimir todos os tickets
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      document.body.appendChild(iframe)
      
      const iframeDoc = iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Tickets de Venda - ${totalTickets} tickets</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: 'Courier New', monospace;
                }
                .ticket {
                  width: 100%;
                  margin: 0;
                  padding: 0;
                }
                .ticket pre {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.2;
                  margin: 0;
                  padding: 20px;
                  white-space: pre-line;
                }
                .ticket-page {
                  page-break-after: always;
                }
                @page { 
                  margin: 0; 
                  size: 80mm 200mm; 
                }
                @media print {
                  .ticket-page {
                    page-break-after: always;
                  }
                  .ticket:last-child {
                    page-break-after: avoid;
                  }
                }
              </style>
            </head>
            <body>
              ${allTicketsHTML}
            </body>
          </html>
        `)
        iframeDoc.close()
        
        // Aguardar carregamento e imprimir tudo de uma vez
        await new Promise(resolve => {
          iframe.onload = () => {
            setTimeout(() => {
              try {
                iframe.contentWindow?.print()
                setTimeout(() => {
                  document.body.removeChild(iframe)
                  resolve(true)
                }, 1000)
              } catch (error) {
                console.error('Erro ao imprimir:', error)
                document.body.removeChild(iframe)
                resolve(true)
              }
            }, 500)
          }
        })
      }
      
      console.log(`Impressão de ${totalTickets} tickets concluída!`)
      onComplete()
    }

    printIndividualTickets()
  }, [sale, onComplete])

  return null
}
