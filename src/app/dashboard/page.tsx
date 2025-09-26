"use client"

import Link from "next/link"
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Plus,
  RefreshCw
} from "lucide-react"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalProducts: number
  todaySales: number
  lowStockProducts: number
  totalUsers: number
  lowStockProductsList: Array<{
    id: string
    name: string
    quantity: number
  }>
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    todaySales: 0,
    lowStockProducts: 0,
    totalUsers: 0,
    lowStockProductsList: []
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      // Buscar estatísticas
      const [productsRes, salesRes, usersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sales'),
        fetch('/api/users')
      ])

      const products = await productsRes.json()
      const sales = await salesRes.json()
      const users = await usersRes.json()

      // Calcular vendas de hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
        const todaySales = sales.filter((sale: { createdAt: string; total: number }) => {
          const saleDate = new Date(sale.createdAt)
          saleDate.setHours(0, 0, 0, 0)
          return saleDate.getTime() === today.getTime()
        }).reduce((total: number, sale: { total: number }) => total + Number(sale.total), 0)

        // Calcular produtos com estoque baixo (menos de 10 unidades)
        const lowStockProductsList = products.filter((product: { inventory?: { quantity: number } }) => 
          product.inventory && product.inventory.quantity < 10
        ).map((product: { id: string; name: string; inventory: { quantity: number } }) => ({
        id: product.id,
        name: product.name,
        quantity: product.inventory.quantity
      }))

      setStats({
        totalProducts: products.length,
        todaySales,
        lowStockProducts: lowStockProductsList.length,
        totalUsers: users.length,
        lowStockProductsList
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Atualizar estatísticas quando a página ganhar foco (usuário voltar do sales)
  useEffect(() => {
    const handleFocus = () => {
      fetchStats()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Carregando...</div>
        </div>
      </div>
    )
  }
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <button
          onClick={() => {
            setLoading(true)
            fetchStats()
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw size={20} className="mr-2" />
          Atualizar
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/products" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Package className="text-white" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Total de Produtos</p>
              <p className="text-white text-2xl font-bold">{stats.totalProducts}</p>
            </div>
          </div>
        </Link>

        <Link href="/sales/history" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <ShoppingCart className="text-white" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Vendas Hoje</p>
              <p className="text-white text-2xl font-bold">R$ {stats.todaySales.toFixed(2)}</p>
            </div>
          </div>
        </Link>

        <Link href="/inventory?filter=low-stock" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Estoque Baixo</p>
              <p className="text-white text-2xl font-bold">{stats.lowStockProducts}</p>
            </div>
          </div>
        </Link>

        <Link href="/users" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Users className="text-white" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Usuários</p>
              <p className="text-white text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <Link
              href="/products/new"
              className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Plus size={20} className="text-white mr-3" />
              <span className="text-white">Adicionar Produto</span>
            </Link>
            <Link
              href="/sales"
              className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ShoppingCart size={20} className="text-white mr-3" />
              <span className="text-white">Nova Venda</span>
            </Link>
            <Link
              href="/inventory"
              className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Package size={20} className="text-white mr-3" />
              <span className="text-white">Verificar Estoque</span>
            </Link>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Produtos em Estoque Baixo</h3>
          {stats.lowStockProductsList.length > 0 ? (
            <div className="space-y-3">
              {stats.lowStockProductsList.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/products/${product.id}/edit`}
                  className="flex items-center justify-between p-3 bg-red-900/20 border border-red-500/30 rounded-lg hover:bg-red-900/30 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-red-400 text-sm">Estoque: {product.quantity} unidades</p>
                  </div>
                  <div className="text-red-500 font-bold">
                    <TrendingUp size={20} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              Nenhum produto com estoque baixo
            </div>
          )}
        </div>
      </div>
    </div>
  )
}