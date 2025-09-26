"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Calendar, User, DollarSign, Search, Printer } from "lucide-react"
import SaleTicket from "@/components/SaleTicket"

interface SaleItem {
  id: string
  quantity: number
  price: number
  subtotal: number
  product: {
    name: string
    unit: string
  }
}

interface Sale {
  id: string
  total: number
  discount: number
  paymentMethod: string
  status: string
  createdAt: string
  user: {
    name: string
  }
  items: SaleItem[]
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showTicket, setShowTicket] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [dateFilter, setDateFilter] = useState("")

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const response = await fetch("/api/sales")
      if (response.ok) {
        const data = await response.json()
        setSales(data)
      }
    } catch (error) {
      console.error("Erro ao buscar vendas:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.items.some(item => 
                           item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    if (!matchesSearch) return false

    if (dateFilter) {
      const saleDate = new Date(sale.createdAt).toDateString()
      const filterDate = new Date(dateFilter).toDateString()
      return saleDate === filterDate
    }

    return true
  })

  const handlePrintTicket = (sale: Sale) => {
    setSelectedSale(sale)
    setShowTicket(true)
  }

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
  const todaySales = sales.filter(sale => {
    const today = new Date().toDateString()
    const saleDate = new Date(sale.createdAt).toDateString()
    return today === saleDate
  }).reduce((sum, sale) => sum + sale.total, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando vendas...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <ShoppingCart className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total de Vendas</p>
                <p className="text-white text-2xl font-bold">{sales.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <DollarSign className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Faturamento Total</p>
                <p className="text-white text-2xl font-bold">
                  R$ {Number(totalSales).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <Calendar className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Vendas Hoje</p>
                <p className="text-white text-2xl font-bold">
                  R$ {Number(todaySales).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar vendas..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="text-gray-400" size={20} />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="space-y-4">
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                Nenhuma venda encontrada
              </h3>
              <p className="text-gray-400">
                {searchTerm || dateFilter 
                  ? "Tente ajustar os filtros de busca" 
                  : "Nenhuma venda foi realizada ainda"
                }
              </p>
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Venda #{sale.id.slice(-8)}
                    </h3>
                    <div className="flex items-center text-sm text-gray-400 mt-1">
                      <User size={16} className="mr-1" />
                      {sale.user.name}
                      <Calendar size={16} className="ml-4 mr-1" />
                      {new Date(sale.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handlePrintTicket(sale)}
                      className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Printer size={16} className="mr-1" />
                      Imprimir
                    </button>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        R$ {Number(sale.total).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {sale.paymentMethod === "dinheiro" ? "Dinheiro" :
                         sale.paymentMethod === "cartao" ? "Cartão" : "PIX"}
                      </div>
                    </div>
                  </div>
                </div>

                {sale.discount > 0 && (
                  <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Desconto aplicado:</span>
                      <span className="text-red-400">-R$ {Number(sale.discount).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Itens vendidos:</h4>
                  {sale.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm bg-gray-700 rounded-lg p-3">
                      <div>
                        <span className="text-white font-medium">{item.product.name}</span>
                        <span className="text-gray-400 ml-2">
                          {item.quantity} {item.product.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-white">
                          R$ {Number(item.price).toFixed(2)} × {item.quantity}
                        </div>
                        <div className="text-green-400 font-semibold">
                          R$ {Number(item.subtotal).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sale Ticket Modal */}
        {showTicket && selectedSale && (
          <SaleTicket
            sale={selectedSale}
            onClose={() => setShowTicket(false)}
          />
        )}
    </div>
  )
}
