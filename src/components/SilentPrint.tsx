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

interface SilentPrintProps {
  sale: Sale
  onComplete: () => void
}

export default function SilentPrint({ sale, onComplete }: SilentPrintProps) {
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

    // Método 1: Tentar impressão silenciosa com CSS
    const trySilentPrint = () => {
      return new Promise((resolve) => {
        // Criar elemento temporário
        const printElement = document.createElement('div')
        printElement.id = 'silent-print-ticket'
        printElement.style.position = 'absolute'
        printElement.style.left = '-9999px'
        printElement.style.top = '-9999px'
        printElement.style.fontFamily = 'Courier New, monospace'
        printElement.style.fontSize = '12px'
        printElement.style.lineHeight = '1.2'
        printElement.style.whiteSpace = 'pre-line'
        printElement.style.width = '300px'
        printElement.textContent = ticketText
        
        document.body.appendChild(printElement)
        
        // CSS para impressão silenciosa
        const printCSS = `
          @media print {
            * { visibility: hidden !important; }
            #silent-print-ticket, #silent-print-ticket * { visibility: visible !important; }
            #silent-print-ticket { 
              position: absolute !important; 
              left: 0 !important; 
              top: 0 !important; 
              width: 100% !important;
              height: 100% !important;
            }
            @page { 
              margin: 0 !important; 
              size: 80mm 200mm !important; 
            }
          }
        `
        
        const styleElement = document.createElement('style')
        styleElement.textContent = printCSS
        document.head.appendChild(styleElement)
        
        // Tentar impressão
        setTimeout(() => {
          try {
            window.print()
            resolve(true)
          } catch {
            resolve(false)
          }
        }, 100)
        
        // Limpar após 3 segundos
        setTimeout(() => {
          try {
            document.body.removeChild(printElement)
            document.head.removeChild(styleElement)
          } catch {
            // Ignorar erros de limpeza
          }
          resolve(true)
        }, 3000)
      })
    }

    // Método 2: Fallback com janela separada
    const tryWindowPrint = () => {
      return new Promise((resolve) => {
        const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=no,resizable=no')
        
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Ticket - ${sale.id ? sale.id.slice(-8) : 'N/A'}</title>
                <style>
                  body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    margin: 0;
                    padding: 20px;
                    white-space: pre-line;
                    background: white;
                  }
                  @page { 
                    margin: 0; 
                    size: 80mm 200mm; 
                  }
                </style>
              </head>
              <body>
                ${ticketText}
              </body>
            </html>
          `)
          printWindow.document.close()
          
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print()
              setTimeout(() => {
                printWindow.close()
                resolve(true)
              }, 2000)
            }, 500)
          }
        } else {
          resolve(false)
        }
      })
    }

    // Executar impressão
    const executePrint = async () => {
      try {
        // Tentar impressão silenciosa primeiro
        const silentSuccess = await trySilentPrint()
        
        if (!silentSuccess) {
          // Fallback para janela separada
          await tryWindowPrint()
        }
      } catch (error) {
        console.error('Erro na impressão:', error)
      } finally {
        onComplete()
      }
    }

    executePrint()
  }, [sale, onComplete])

  return null
}
