"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface Barrel {
  id: string
  name: string
  volumeTotalMl: number
  volumeDisponivelMl: number
  mlResiduoMinimo: number
  status: 'ACTIVE' | 'CLOSED' | 'MAINTENANCE'
  createdAt: string
  updatedAt: string
  closedAt?: string
  productCount: number
  ticketCount: number
  percentualDisponivel: number
  isLowVolume: boolean
}

export default function BarrelsPage() {
  const [barrels, setBarrels] = useState<Barrel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBarrel, setNewBarrel] = useState({
    name: "",
    volumeTotalMl: 50000,
    mlResiduoMinimo: 50
  })

  useEffect(() => {
    loadBarrels()
  }, [])

  const loadBarrels = async () => {
    try {
      const response = await fetch('/api/barrels')
      if (response.ok) {
        const data = await response.json()
        setBarrels(data)
      }
    } catch (error) {
      console.error('Erro ao carregar barrils:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBarrel = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/barrels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBarrel),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewBarrel({ name: "", volumeTotalMl: 50000, mlResiduoMinimo: 50 })
        loadBarrels()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao criar barril')
      }
    } catch (error) {
      console.error('Erro ao criar barril:', error)
      alert('Erro ao criar barril')
    }
  }

  const handleCloseBarrel = async (barrelId: string) => {
    if (!confirm('Tem certeza que deseja encerrar este barril?')) {
      return
    }

    try {
      const response = await fetch(`/api/barrels/${barrelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CLOSED' }),
      })

      if (response.ok) {
        loadBarrels()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao encerrar barril')
      }
    } catch (error) {
      console.error('Erro ao encerrar barril:', error)
      alert('Erro ao encerrar barril')
    }
  }

  const formatVolume = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`
    }
    return `${ml}ml`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'CLOSED':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'MAINTENANCE':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo'
      case 'CLOSED':
        return 'Encerrado'
      case 'MAINTENANCE':
        return 'Manutenção'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Carregando barrils...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Gerenciar Barrils</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Barril
        </button>
      </div>

      {/* Lista de Barrils */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {barrels.map((barrel) => (
          <div
            key={barrel.id}
            className={`bg-gray-800 rounded-lg p-6 border ${
              barrel.isLowVolume ? 'border-yellow-500' : 'border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{barrel.name}</h3>
                <div className="flex items-center mt-1">
                  {getStatusIcon(barrel.status)}
                  <span className="ml-2 text-sm text-gray-400">
                    {getStatusText(barrel.status)}
                  </span>
                </div>
              </div>
              {barrel.isLowVolume && (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Volume Total</span>
                  <span>{formatVolume(barrel.volumeTotalMl)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Disponível</span>
                  <span>{formatVolume(barrel.volumeDisponivelMl)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      barrel.percentualDisponivel > 20
                        ? 'bg-green-500'
                        : barrel.percentualDisponivel > 10
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${barrel.percentualDisponivel}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {barrel.percentualDisponivel}% disponível
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Produtos:</span>
                  <span className="text-white ml-1">{barrel.productCount}</span>
                </div>
                <div>
                  <span className="text-gray-400">Tickets:</span>
                  <span className="text-white ml-1">{barrel.ticketCount}</span>
                </div>
              </div>

              {barrel.isLowVolume && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
                  <p className="text-yellow-400 text-xs">
                    ⚠️ Volume baixo! Considere encerrar o barril.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Link
                  href={`/barrels/${barrel.id}`}
                  className="flex-1 text-center px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  Ver Detalhes
                </Link>
                {barrel.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleCloseBarrel(barrel.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    Encerrar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {barrels.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            Nenhum barril encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Crie seu primeiro barril para começar a vender produtos fracionados.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Criar Primeiro Barril
          </button>
        </div>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Novo Barril</h2>
            
            <form onSubmit={handleCreateBarrel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Barril *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Barril Pio Sem Verasso #001"
                  value={newBarrel.name}
                  onChange={(e) => setNewBarrel({ ...newBarrel, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Volume Total (ml) *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="100"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="50000"
                  value={newBarrel.volumeTotalMl}
                  onChange={(e) => setNewBarrel({ ...newBarrel, volumeTotalMl: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ex: 50000ml = 50L
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resíduo Mínimo (ml)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="50"
                  value={newBarrel.mlResiduoMinimo}
                  onChange={(e) => setNewBarrel({ ...newBarrel, mlResiduoMinimo: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Volume mínimo para considerar resíduo
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Criar Barril
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
