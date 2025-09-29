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

    // Criar conteúdo do ticket
    let ticketContent = ""
    ticketContent += "=".repeat(32) + "\n"
    ticketContent += "        CADASTRO DO PEDRO\n"
    ticketContent += "        Sistema de Vendas\n"
    ticketContent += "=".repeat(32) + "\n"
    ticketContent += `Ticket: #${sale.id ? sale.id.slice(-8) : 'N/A'}\n`
    ticketContent += `${formatDate(sale.createdAt)}\n`
    ticketContent += "-".repeat(32) + "\n"
    
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((item) => {
        const name = item.product?.name || 'Produto'
        const quantity = item.quantity
        const price = Number(item.price || 0).toFixed(2)
        const subtotal = Number(item.subtotal || 0).toFixed(2)
        
        ticketContent += `${name}\n`
        ticketContent += `${quantity}x R$ ${price} = R$ ${subtotal}\n`
        ticketContent += "\n"
      })
    } else {
      ticketContent += "Nenhum item encontrado\n\n"
    }
    
    if (sale.discount && sale.discount > 0) {
      ticketContent += `Desconto: -R$ ${Number(sale.discount).toFixed(2)}\n`
    }
    
    ticketContent += "-".repeat(32) + "\n"
    ticketContent += `TOTAL: R$ ${Number(sale.total || 0).toFixed(2)}\n`
    ticketContent += "=".repeat(32) + "\n"
    ticketContent += "Obrigado pela preferência!\n"
    ticketContent += "Volte sempre!\n"
    ticketContent += "=".repeat(32) + "\n"

    // Método 1: Tentar usar Web Printing API (se disponível)
    const tryWebPrintAPI = () => {
      return new Promise((resolve) => {
        // Verificar se o navegador suporta Web Printing API
        if ('navigator' in window && 'serviceWorker' in navigator) {
          try {
            // Tentar usar a API de impressão do navegador
            const blob = new Blob([ticketContent], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            
            // Criar link temporário para impressão
            const link = document.createElement('a')
            link.href = url
            link.target = '_blank'
            link.style.display = 'none'
            document.body.appendChild(link)
            
            // Tentar impressão direta
            setTimeout(() => {
              try {
                link.click()
                window.print()
                resolve(true)
              } catch {
                resolve(false)
              }
            }, 100)
            
            // Limpar recursos
            setTimeout(() => {
              try {
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
              } catch (e) {
                // Ignorar erros de limpeza
              }
            }, 3000)
            
          } catch (error) {
            resolve(false)
          }
        } else {
          resolve(false)
        }
      })
    }

    // Método 2: Impressão com iframe oculto
    const tryIframePrint = () => {
      return new Promise((resolve) => {
        const iframe = document.createElement('iframe')
        iframe.style.position = 'absolute'
        iframe.style.left = '-9999px'
        iframe.style.top = '-9999px'
        iframe.style.width = '300px'
        iframe.style.height = '400px'
        iframe.style.border = 'none'
        
        document.body.appendChild(iframe)
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        
        if (iframeDoc) {
          iframeDoc.open()
          iframeDoc.write(`
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
                    padding: 10px;
                    white-space: pre-line;
                    background: white;
                    color: black;
                  }
                  @page { 
                    margin: 0; 
                    size: 80mm 200mm; 
                  }
                  @media print {
                    body { 
                      margin: 0; 
                      padding: 5px;
                    }
                  }
                </style>
              </head>
              <body>
                ${ticketContent}
              </body>
            </html>
          `)
          iframeDoc.close()
          
          iframe.onload = () => {
            setTimeout(() => {
              try {
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()
                resolve(true)
              } catch {
                resolve(false)
              }
            }, 500)
          }
        } else {
          resolve(false)
        }
        
        // Limpar iframe após 5 segundos
        setTimeout(() => {
          try {
            document.body.removeChild(iframe)
          } catch {
            // Ignorar erros de limpeza
          }
        }, 5000)
      })
    }

    // Método 3: Impressão com elemento temporário
    const tryElementPrint = () => {
      return new Promise((resolve) => {
        const printDiv = document.createElement('div')
        printDiv.id = 'direct-print-ticket'
        printDiv.style.position = 'absolute'
        printDiv.style.left = '-9999px'
        printDiv.style.top = '-9999px'
        printDiv.style.fontFamily = 'Courier New, monospace'
        printDiv.style.fontSize = '12px'
        printDiv.style.lineHeight = '1.2'
        printDiv.style.whiteSpace = 'pre-line'
        printDiv.style.width = '300px'
        printDiv.style.backgroundColor = 'white'
        printDiv.style.padding = '10px'
        printDiv.style.color = 'black'
        printDiv.textContent = ticketContent
        
        document.body.appendChild(printDiv)
        
        // CSS para impressão
        const printCSS = `
          @media print {
            * { visibility: hidden !important; }
            #direct-print-ticket, #direct-print-ticket * { visibility: visible !important; }
            #direct-print-ticket { 
              position: absolute !important; 
              left: 0 !important; 
              top: 0 !important; 
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 10px !important;
              background: white !important;
              color: black !important;
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
            window.focus()
            window.print()
            resolve(true)
          } catch (error) {
            resolve(false)
          }
        }, 200)
        
        // Limpar elementos após 3 segundos
        setTimeout(() => {
          try {
            document.body.removeChild(printDiv)
            document.head.removeChild(styleElement)
          } catch {
            // Ignorar erros de limpeza
          }
        }, 3000)
      })
    }

    // Método 4: Fallback com janela separada
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
                    color: black;
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
          printWindow.document.close()
          
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.focus()
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

    // Executar impressão com múltiplas tentativas
    const executeDirectPrint = async () => {
      try {
        console.log('🖨️ Tentando impressão direta...')
        
        // Tentar Web Printing API primeiro
        let success = await tryWebPrintAPI()
        
        if (!success) {
          console.log('🔄 Web API falhou, tentando iframe...')
          success = await tryIframePrint()
        }
        
        if (!success) {
          console.log('🔄 Iframe falhou, tentando elemento temporário...')
          success = await tryElementPrint()
        }
        
        if (!success) {
          console.log('🔄 Elemento temporário falhou, usando janela separada...')
          await tryWindowPrint()
        }
        
        console.log('✅ Impressão direta concluída')
      } catch (error) {
        console.error('❌ Erro na impressão direta:', error)
      } finally {
        onComplete()
      }
    }

    executeDirectPrint()
  }, [sale, onComplete])

  return null
}