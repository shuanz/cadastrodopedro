"use client"

import { useEffect, useRef } from "react"

interface SaleItem {
  id: string
  product: {
    name: string
    price?: number
    unit?: string
  }
  quantity: number
  price: number
  subtotal: number
}

interface Sale {
  id: string
  total: number
  discount: number
  createdAt: string
  items: SaleItem[]
}

interface DirectPrintProps {
  sale: Sale
  onComplete: () => void
}

export default function DirectPrint({ sale, onComplete }: DirectPrintProps) {
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

    // Criar conteúdo de texto simples
    let ticketText = ""
    ticketText += "=".repeat(32) + "\n"
    ticketText += "        CADASTRO DO PEDRO\n"
    ticketText += "        Sistema de Vendas\n"
    ticketText += "=".repeat(32) + "\n"
    ticketText += `Ticket: #${sale.id ? sale.id.slice(-8) : 'N/A'}\n`
    ticketText += `${formatDate(sale.createdAt)}\n`
    ticketText += "-".repeat(32) + "\n"
    
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((item) => {
        const name = item.product?.name || 'Produto'
        const quantity = item.quantity
        const price = Number(item.price || 0).toFixed(2)
        const subtotal = Number(item.subtotal || 0).toFixed(2)
        
        ticketText += `${name}\n`
        ticketText += `${quantity}x R$ ${price} = R$ ${subtotal}\n`
        ticketText += "\n"
      })
    } else {
      ticketText += "Nenhum item encontrado\n\n"
    }
    
    if (sale.discount && sale.discount > 0) {
      ticketText += `Desconto: -R$ ${Number(sale.discount).toFixed(2)}\n`
    }
    
    ticketText += "-".repeat(32) + "\n"
    ticketText += `TOTAL: R$ ${Number(sale.total || 0).toFixed(2)}\n`
    ticketText += "=".repeat(32) + "\n"
    ticketText += "Obrigado pela preferência!\n"
    ticketText += "Volte sempre!\n"
    ticketText += "=".repeat(32) + "\n"

    // Tentar impressão silenciosa primeiro
    try {
      // Criar elemento temporário para impressão
      const printElement = document.createElement('div')
      printElement.style.position = 'absolute'
      printElement.style.left = '-9999px'
      printElement.style.fontFamily = 'Courier New, monospace'
      printElement.style.fontSize = '12px'
      printElement.style.lineHeight = '1.2'
      printElement.style.whiteSpace = 'pre-line'
      printElement.textContent = ticketText
      
      document.body.appendChild(printElement)
      
      // Configurar CSS para impressão silenciosa
      const printStyles = document.createElement('style')
      printStyles.textContent = `
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; }
          @page { margin: 0; size: 80mm 200mm; }
        }
      `
      document.head.appendChild(printStyles)
      
      printElement.className = 'print-content'
      
      // Tentar impressão silenciosa
      window.print()
      
      // Limpar elementos temporários
      setTimeout(() => {
        document.body.removeChild(printElement)
        document.head.removeChild(printStyles)
        onComplete()
      }, 1000)
      
    } catch (error) {
      console.log('Impressão silenciosa falhou, usando janela separada')
      
      // Fallback: janela separada
      const printWindow = window.open('', '_blank', 'width=400,height=600')
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ticket</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.2;
                  margin: 0;
                  padding: 20px;
                  white-space: pre-line;
                }
                @page { margin: 0; size: 80mm 200mm; }
              </style>
            </head>
            <body>
              ${ticketText}
            </body>
          </html>
        `)
        printWindow.document.close()
        
        // Aguardar carregamento e imprimir
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            // Fechar janela após um tempo
            setTimeout(() => {
              printWindow.close()
              onComplete()
            }, 2000)
          }, 1000)
        }
      } else {
        onComplete()
      }
    }
  }, [sale, onComplete])

  return null
}