import { useEffect, useRef } from 'react'

interface Sale {
  id: string
  createdAt: string
  total: number
  discount?: number
  items: Array<{
    id: string
    productId: string
    quantity: number
    price: number
    subtotal: number
    product: {
      name: string
      category: string
      unit: string
    }
  }>
}

interface IndividualTicketPrintProps {
  sale: Sale
  onComplete: () => void
}

export default function IndividualTicketPrint({ sale, onComplete }: IndividualTicketPrintProps) {
  const hasExecuted = useRef(false)

  useEffect(() => {
    if (hasExecuted.current) return
    hasExecuted.current = true

    console.log("🖨️ IndividualTicketPrint iniciado!")
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

    const generateIndividualTicketContent = (item: any, ticketNumber: number, totalTickets: number) => {
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
      ticketText += `${item.quantity}x R$ ${Number(item.price).toFixed(2)} = R$ ${Number(item.subtotal).toFixed(2)}\n`
      ticketText += "-".repeat(32) + "\n"
      ticketText += `TOTAL: R$ ${Number(item.subtotal).toFixed(2)}\n`
      ticketText += "=".repeat(32) + "\n"
      ticketText += "Obrigado pela preferência!\n"
      ticketText += "Volte sempre!\n"
      ticketText += "=".repeat(32) + "\n"

      return ticketText
    }

    const printIndividualTickets = async () => {
      // Gerar um ticket por produto vendido (não por unidade)
      const totalTickets = sale.items.length
      let currentTicketNumber = 1

      console.log(`🖨️ Iniciando impressão de ${totalTickets} tickets (um por produto)...`)

      for (const item of sale.items) {
        const ticketContent = generateIndividualTicketContent(item, currentTicketNumber, totalTickets)
        
        console.log(`🖨️ Imprimindo ticket ${currentTicketNumber}/${totalTickets}: ${item.product.name} (${item.quantity}x)`)

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
                <title>Ticket ${currentTicketNumber}/${totalTickets}</title>
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

        currentTicketNumber++
        
        // Pequena pausa entre tickets para evitar conflitos
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      console.log(`✅ Impressão de ${totalTickets} tickets concluída!`)
      onComplete()
    }

    printIndividualTickets()
  }, [sale, onComplete])

  return null
}
