"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Package, Plus, TrendingDown, AlertTriangle, Search } from "lucide-react"

interface InventoryItem {
  id: string
  quantity: number
  minQuantity: number
  maxQuantity: number | null
  lastUpdated: string
  product: {
    id: string
    name: string
    category: string
    unit: string
    price: number
    isActive: boolean
  }
}

export default function InventoryPage() {
  const searchParams = useSearchParams()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "low" | "out">("all")

  useEffect(() => {
    fetchInventory()
    
    // Verificar se há filtro na URL
    const urlFilter = searchParams.get('filter')
    if (urlFilter === 'low-stock') {
      setFilter('low')
    } else if (urlFilter === 'out-of-stock') {
      setFilter('out')
    }
  }, [searchParams])

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/inventory")
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (error) {
      console.error("Erro ao buscar estoque:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    try {
      const response = await fetch(`/api/inventory/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      })

      if (response.ok) {
        // Atualizar o estado local
        setInventory(inventory.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: newQuantity, lastUpdated: new Date().toISOString() }
            : item
        ))
      } else {
        alert("Erro ao atualizar estoque")
      }
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error)
      alert("Erro ao atualizar estoque")
    }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    switch (filter) {
      case "low":
        return item.quantity <= item.minQuantity
      case "out":
        return item.quantity === 0
      default:
        return true
    }
  })

  const lowStockCount = inventory.filter(item => item.quantity <= item.minQuantity).length
  const outOfStockCount = inventory.filter(item => item.quantity === 0).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando estoque...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Package className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total de Produtos</p>
                <p className="text-white text-2xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <TrendingDown className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Estoque Baixo</p>
                <p className="text-white text-2xl font-bold">{lowStockCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-600 rounded-lg">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Sem Estoque</p>
                <p className="text-white text-2xl font-bold">{outOfStockCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <Package className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Valor Total</p>
                <p className="text-white text-2xl font-bold">
                  R$ {inventory.reduce((sum, item) => sum + (item.quantity * Number(item.product.price)), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "all" 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter("low")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "low" 
                    ? "bg-yellow-600 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Estoque Baixo
              </button>
              <button
                onClick={() => setFilter("out")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "out" 
                    ? "bg-red-600 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Sem Estoque
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Estoque Atual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Estoque Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Preço Unitário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {item.product.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {item.product.unit}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">
                        {item.product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        item.quantity === 0 
                          ? "text-red-400" 
                          : item.quantity <= item.minQuantity 
                            ? "text-yellow-400" 
                            : "text-white"
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">
                        {item.minQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">
                        R$ {Number(item.product.price).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-white">
                        R$ {(item.quantity * Number(item.product.price)).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 0
                            handleUpdateQuantity(item.product.id, newQuantity)
                          }}
                          className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filter !== "all" 
                ? "Tente ajustar os filtros de busca" 
                : "Comece adicionando produtos ao estoque"
              }
            </p>
            {!searchTerm && filter === "all" && (
              <Link
                href="/products/new"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Adicionar Produto
              </Link>
            )}
          </div>
        )}
    </div>
  )
}
