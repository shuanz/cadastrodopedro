"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Edit, Trash2, Package, Ruler } from "lucide-react"

interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  productCount: number
  createdAt: string
  updatedAt: string
}

interface Unit {
  id: string
  name: string
  symbol: string
  description?: string
  isActive: boolean
  productCount: number
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'categories' | 'units'>('categories')
  
  // Estados para formulários
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showUnitForm, setShowUnitForm] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [unitForm, setUnitForm] = useState({ name: '', symbol: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchUnits()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/units')
      if (response.ok) {
        const data = await response.json()
        setUnits(data)
      }
    } catch (error) {
      console.error('Erro ao buscar unidades:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryForm),
      })

      if (response.ok) {
        setCategoryForm({ name: '', description: '' })
        setShowCategoryForm(false)
        fetchCategories()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar categoria')
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      alert('Erro ao criar categoria')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unitForm),
      })

      if (response.ok) {
        setUnitForm({ name: '', symbol: '', description: '' })
        setShowUnitForm(false)
        fetchUnits()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar unidade')
      }
    } catch (error) {
      console.error('Erro ao criar unidade:', error)
      alert('Erro ao criar unidade')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Carregando...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <h1 className="text-3xl font-bold">Configurações</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Categorias
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'units'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Ruler className="w-4 h-4 inline mr-2" />
            Unidades
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Categorias de Produtos</h2>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </button>
            </div>

            {/* Category Form */}
            {showCategoryForm && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Nova Categoria</h3>
                <form onSubmit={handleCreateCategory}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Ex: Bebidas"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Descrição
                      </label>
                      <input
                        type="text"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Ex: Bebidas em geral"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {submitting ? 'Criando...' : 'Criar Categoria'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryForm(false)
                        setCategoryForm({ name: '', description: '' })
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <div className="flex space-x-2">
                      <button className="text-blue-400 hover:text-blue-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-gray-400 text-sm mb-2">{category.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{category.productCount} produtos</span>
                    <span className={category.isActive ? 'text-green-400' : 'text-red-400'}>
                      {category.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Units Tab */}
        {activeTab === 'units' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Unidades de Medida</h2>
              <button
                onClick={() => setShowUnitForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Unidade
              </button>
            </div>

            {/* Unit Form */}
            {showUnitForm && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Nova Unidade</h3>
                <form onSubmit={handleCreateUnit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={unitForm.name}
                        onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Ex: Unidade"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Símbolo *
                      </label>
                      <input
                        type="text"
                        value={unitForm.symbol}
                        onChange={(e) => setUnitForm({ ...unitForm, symbol: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Ex: un"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Descrição
                      </label>
                      <input
                        type="text"
                        value={unitForm.description}
                        onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Ex: Unidade individual"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {submitting ? 'Criando...' : 'Criar Unidade'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUnitForm(false)
                        setUnitForm({ name: '', symbol: '', description: '' })
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Units List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => (
                <div key={unit.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{unit.name}</h3>
                    <div className="flex space-x-2">
                      <button className="text-blue-400 hover:text-blue-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-400 font-mono text-sm">({unit.symbol})</span>
                    {unit.description && (
                      <span className="text-gray-400 text-sm">{unit.description}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{unit.productCount} produtos</span>
                    <span className={unit.isActive ? 'text-green-400' : 'text-red-400'}>
                      {unit.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
