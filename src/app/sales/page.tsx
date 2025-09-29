"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingCart, Search, Trash2, Printer } from "lucide-react"
import SaleTicket from "@/components/SaleTicket"
import DirectPrint from "@/components/DirectPrint"
import SilentPrint from "@/components/SilentPrint"
import AutoPrint from "@/components/AutoPrint"
import FractionedTicketPrint from "@/components/FractionedTicketPrint"
import IndividualTicketPrint from "@/components/IndividualTicketPrint"

interface Product {
  id: string
  name: string
  price: number
  unit: string
  isActive: boolean
  inventory?: {
    quantity: number
  }
}

interface SaleItem {
  productId: string
  product: Product
  quantity: number
  price: number
  subtotal: number
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [processingSale, setProcessingSale] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("dinheiro")
  const [discount, setDiscount] = useState("0")
  const [showTicket, setShowTicket] = useState(false)
  const [lastSale, setLastSale] = useState<{
    id: string
    total: number
    discount: number
    createdAt: string
    user: {
      name: string
    }
    items: Array<{
      id: string
      product: {
        name: string
        price?: number
        unit?: string
      }
      quantity: number
      price: number
      subtotal: number
    }>
  } | null>(null)
  const [showDirectPrint, setShowDirectPrint] = useState(false)
  const [showSilentPrint, setShowSilentPrint] = useState(false)
  const [showAutoPrint, setShowAutoPrint] = useState(false)
  const [showFractionedTickets, setShowFractionedTickets] = useState(false)
  const [showIndividualTickets, setShowIndividualTickets] = useState(false)
  const [fractionedTickets, setFractionedTickets] = useState<Array<{
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
  }>>([])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data.filter((product: Product) => product.isActive))
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
    } finally {
      setLoading(false)
    }
  }

  const addProductToSale = (product: Product) => {
    const existingItem = saleItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      // Verificar se há estoque suficiente
      if (product.inventory && existingItem.quantity >= product.inventory.quantity) {
        alert("Estoque insuficiente")
        return
      }
      
      setSaleItems(saleItems.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * Number(item.price)
            }
          : item
      ))
    } else {
      // Verificar se há estoque
      if (product.inventory && product.inventory.quantity <= 0) {
        alert("Produto sem estoque")
        return
      }
      
      setSaleItems([
        ...saleItems,
        {
          productId: product.id,
          product,
          quantity: 1,
          price: Number(product.price),
          subtotal: Number(product.price)
        }
      ])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProductFromSale(productId)
      return
    }

    const product = products.find(p => p.id === productId)
    if (product?.inventory && newQuantity > product.inventory.quantity) {
      alert("Estoque insuficiente")
      return
    }

    setSaleItems(saleItems.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * Number(item.price)
          }
        : item
    ))
  }

  const removeProductFromSale = (productId: string) => {
    setSaleItems(saleItems.filter(item => item.productId !== productId))
  }

  const calculateTotal = () => {
    const subtotal = saleItems.reduce((sum, item) => sum + Number(item.subtotal), 0)
    const discountValue = parseFloat(discount) || 0
    return subtotal - discountValue
  }

  const processSale = async (printOnly = false) => {
    if (saleItems.length === 0) {
      alert("Adicione produtos à venda")
      return
    }

    setProcessingSale(true)

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: saleItems.map((item: { productId: string; quantity: number; price: number; subtotal: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          })),
          paymentMethod,
          discount: parseFloat(discount) || 0,
        }),
      })

      if (response.ok) {
        const saleData = await response.json()
        console.log("Dados da venda recebidos:", saleData)
        setLastSale(saleData.sale)
        
        // Verificar se há fichas fracionadas para imprimir
        if (saleData.sale.tickets && saleData.sale.tickets.length > 0) {
          console.log(`🖨️ Fichas fracionadas geradas: ${saleData.ticketsGenerated}`)
          setFractionedTickets(saleData.sale.tickets)
          setShowFractionedTickets(true)
        }
        
        if (printOnly) {
          // Imprimir tickets individuais (um por produto vendido)
          console.log("Executando impressão de tickets individuais")
          setShowIndividualTickets(true)
          setShowTicket(false) // Garantir que o modal não apareça
          setShowDirectPrint(false) // Garantir que a impressão direta não execute
          setShowSilentPrint(false) // Garantir que a impressão silenciosa não execute
          setShowAutoPrint(false) // Garantir que a impressão automática não execute
          setShowFractionedTickets(false) // Garantir que tickets fracionados não executem
        } else {
          // Mostrar modal normalmente
          console.log("Executando venda com modal")
          setShowTicket(true)
          setShowDirectPrint(false) // Garantir que a impressão direta não execute
          setShowSilentPrint(false) // Garantir que a impressão silenciosa não execute
          setShowAutoPrint(false) // Garantir que a impressão automática não execute
          setShowIndividualTickets(false) // Garantir que tickets individuais não executem
        }
        
        setSaleItems([])
        setDiscount("0")
        fetchProducts() // Atualizar estoque
      } else {
        const data = await response.json()
        alert(data.error || "Erro ao processar venda")
      }
    } catch (error) {
      console.error("Erro ao processar venda:", error)
      alert("Erro ao processar venda")
    } finally {
      setProcessingSale(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando produtos...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/sales/history"
          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Histórico de Vendas
        </Link>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Produtos Disponíveis</h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={() => addProductToSale(product)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-medium truncate">{product.name}</h4>
                      <span className="text-green-400 font-semibold">
                        R$ {Number(product.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{product.unit}</span>
                      <span className={`${
                        (product.inventory?.quantity || 0) <= 10 
                          ? "text-red-400" 
                          : "text-gray-300"
                      }`}>
                        Estoque: {product.inventory?.quantity || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sale Cart */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Carrinho de Vendas</h3>
              
              {saleItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-400">Carrinho vazio</p>
                </div>
              ) : (
                <>
                  {/* Sale Items */}
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {saleItems.map((item) => (
                      <div key={item.productId} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white text-sm font-medium">{item.product.name}</h4>
                          <button
                            onClick={() => removeProductFromSale(item.productId)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-6 h-6 bg-gray-600 rounded text-white text-sm hover:bg-gray-500"
                            >
                              -
                            </button>
                            <span className="text-white text-sm w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-6 h-6 bg-gray-600 rounded text-white text-sm hover:bg-gray-500"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-green-400 font-semibold">
                            R$ {Number(item.subtotal).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Forma de Pagamento
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao">Cartão</option>
                        <option value="pix">PIX</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Desconto (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-700 pt-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Subtotal:</span>
                      <span className="text-white">
                        R$ {saleItems.reduce((sum, item) => sum + Number(item.subtotal), 0).toFixed(2)}
                      </span>
                    </div>
                    {parseFloat(discount) > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Desconto:</span>
                        <span className="text-red-400">
                          -R$ {parseFloat(discount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span className="text-white">Total:</span>
                      <span className="text-green-400">
                        R$ {Number(calculateTotal()).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Process Sale Button */}
                  <div className="mb-4 p-4 bg-blue-100 border-4 border-blue-500 rounded-lg">
                    <p className="text-blue-800 text-lg font-bold text-center mb-3">
                      🖨️ IMPRIMIR TICKET DE VENDA 🖨️
                    </p>
                    <p className="text-blue-700 text-sm text-center mb-4">
                      Clique no botão abaixo para imprimir o ticket
                    </p>
                    <button
                      onClick={() => {
                        console.log("Clicou em Imprimir Ticket")
                        alert("Imprimindo ticket...")
                        processSale(true)
                      }}
                      disabled={processingSale}
                      className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-4 border-blue-400 shadow-lg text-lg font-bold"
                    >
                      <Printer size={28} className="mr-3" />
                      {processingSale ? "Processando..." : "🖨️ IMPRIMIR TICKET"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sale Ticket Modal */}
        {showTicket && lastSale && !showDirectPrint && (
          <>
            {console.log("Renderizando SaleTicket")}
            <SaleTicket
              sale={lastSale}
              onClose={() => setShowTicket(false)}
              printOnly={false}
            />
          </>
        )}

        {/* Auto Print Component */}
        {showAutoPrint && lastSale && (
          <>
            {console.log("Renderizando AutoPrint")}
            <AutoPrint
              sale={lastSale}
              onComplete={() => setShowAutoPrint(false)}
            />
          </>
        )}

        {/* Silent Print Component */}
        {showSilentPrint && lastSale && (
          <>
            {console.log("Renderizando SilentPrint")}
            <SilentPrint
              sale={lastSale}
              onComplete={() => setShowSilentPrint(false)}
            />
          </>
        )}

        {/* Direct Print Component (fallback) */}
        {showDirectPrint && lastSale && (
          <>
            {console.log("Renderizando DirectPrint")}
            <DirectPrint
              sale={lastSale}
              onComplete={() => setShowDirectPrint(false)}
            />
          </>
        )}

        {/* Individual Tickets Print Component */}
        {showIndividualTickets && lastSale && (
          <>
            <IndividualTicketPrint
              sale={lastSale}
              onComplete={() => {
                console.log("IndividualTicketPrint completado")
                setShowIndividualTickets(false)
              }}
            />
          </>
        )}

        {/* Fractioned Tickets Print Component */}
        {showFractionedTickets && lastSale && fractionedTickets.length > 0 && (
          <>
            {console.log("Renderizando FractionedTicketPrint")}
            <FractionedTicketPrint
              sale={lastSale}
              tickets={fractionedTickets}
              onComplete={() => setShowFractionedTickets(false)}
            />
          </>
        )}
    </div>
  )
}
