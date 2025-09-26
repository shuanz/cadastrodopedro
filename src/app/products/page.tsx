"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, Search, Package } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  cost: number
  category: string
  unit: string
  barcode: string | null
  isActive: boolean
  inventory?: {
    quantity: number
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProducts(products.filter(product => product.id !== id))
      } else {
        alert("Erro ao excluir produto")
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      alert("Erro ao excluir produto")
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
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
          href="/products/new"
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Produto
        </Link>
      </div>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? "Tente ajustar os termos de busca" 
                : "Comece adicionando seu primeiro produto"
              }
            </p>
            {!searchTerm && (
              <Link
                href="/products/new"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Adicionar Produto
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
                  <div className="flex space-x-2">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="text-gray-400 hover:text-indigo-400"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Categoria:</span>
                    <span className="text-white">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Preço:</span>
                    <span className="text-green-400 font-semibold">
                      R$ {Number(product.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Custo:</span>
                    <span className="text-yellow-400">
                      R$ {Number(product.cost).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estoque:</span>
                    <span className={`font-semibold ${
                      (product.inventory?.quantity || 0) <= 10 
                        ? "text-red-400" 
                        : "text-white"
                    }`}>
                      {product.inventory?.quantity || 0} {product.unit}
                    </span>
                  </div>
                  {product.barcode && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Código:</span>
                      <span className="text-white text-xs">{product.barcode}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.isActive 
                        ? "bg-green-900 text-green-300" 
                        : "bg-red-900 text-red-300"
                    }`}>
                      {product.isActive ? "Ativo" : "Inativo"}
                    </span>
                    <span className="text-gray-400 text-xs">
                      Margem: {((Number(product.price) - Number(product.cost)) / Number(product.price) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
