"use client"

import { useEffect, useRef, useCallback } from "react"

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

interface TicketProps {
  sale: Sale
  onClose: () => void
  printOnly?: boolean
}

export default function SaleTicket({ sale, onClose, printOnly = false }: TicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null)

  console.log("Dados da venda no ticket:", sale)

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

  const handlePrint = useCallback(() => {
    if (ticketRef.current) {
      // Tentar impressão direta primeiro
      try {
        window.print()
        return
      } catch {
        console.log("Impressão direta falhou, tentando janela separada")
      }

      // Fallback: janela separada
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ticket de Venda - ${sale.id ? sale.id.slice(-8) : 'N/A'}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  margin: 0;
                  padding: 10px;
                  background: white;
                }
                .ticket {
                  width: 300px;
                  margin: 0 auto;
                  border: 1px solid #000;
                  padding: 10px;
                }
                .header {
                  text-align: center;
                  border-bottom: 1px dashed #000;
                  padding-bottom: 10px;
                  margin-bottom: 10px;
                }
                .item {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 5px;
                }
                .total {
                  border-top: 1px dashed #000;
                  padding-top: 10px;
                  margin-top: 10px;
                  font-weight: bold;
                }
                .footer {
                  text-align: center;
                  margin-top: 15px;
                  font-size: 10px;
                }
              </style>
            </head>
            <body>
              ${ticketRef.current.innerHTML}
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
    }
  }, [sale.id])

  useEffect(() => {
    // Auto print when component mounts (only if not printOnly)
    if (!printOnly) {
      setTimeout(() => {
        handlePrint()
      }, 100)
    }
  }, [printOnly, handlePrint])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        {!printOnly && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ticket de Venda</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Ticket Preview */}
        <div ref={ticketRef} className="ticket bg-white border border-gray-300 p-4 mb-4">
          <div className="header">
            <h2 className="text-lg font-bold">CADASTRO DO PEDRO</h2>
            <p className="text-sm">Sistema de Vendas</p>
            <p className="text-xs">Ticket: #{sale.id ? sale.id.slice(-8) : 'N/A'}</p>
            <p className="text-xs">{formatDate(sale.createdAt)}</p>
          </div>

          <div className="items">
            {sale.items && sale.items.length > 0 ? sale.items.map((item) => (
              <div key={item.id} className="item">
                <div>
                  <div className="font-medium">{item.product?.name || 'Produto'}</div>
                  <div className="text-xs">
                    {item.quantity}x R$ {Number(item.price || 0).toFixed(2)}
                  </div>
                </div>
                <div className="font-medium">
                  R$ {Number(item.subtotal || 0).toFixed(2)}
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">
                Nenhum item encontrado
              </div>
            )}
          </div>

          {sale.discount && sale.discount > 0 && (
            <div className="item">
              <span>Desconto:</span>
              <span>- R$ {Number(sale.discount).toFixed(2)}</span>
            </div>
          )}

          <div className="total">
            <div className="item">
              <span>TOTAL:</span>
              <span>R$ {Number(sale.total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="footer">
            <p>Obrigado pela preferência!</p>
            <p>Volte sempre!</p>
          </div>
        </div>

        {!printOnly && (
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Imprimir Novamente
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

