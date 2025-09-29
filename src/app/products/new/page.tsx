"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

interface Category {
  id: string
  name: string
  description?: string
}

interface Unit {
  id: string
  name: string
  symbol: string
  description?: string
}

interface Barrel {
  id: string
  name: string
  volumeTotalMl: number
  volumeDisponivelMl: number
  status: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [barrels, setBarrels] = useState<Barrel[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    cost: "",
    category: "",
    unit: "",
    barcode: "",
    minQuantity: "0",
    maxQuantity: "",
    productType: "UNIT",
    volumeRetiradaMl: "",
    barrelId: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar categorias, unidades e barrils em paralelo
        const [categoriesResponse, unitsResponse, barrelsResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/units'),
          fetch('/api/barrels')
        ])

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData)
        }

        if (unitsResponse.ok) {
          const unitsData = await unitsResponse.json()
          setUnits(unitsData)
        }

        if (barrelsResponse.ok) {
          const barrelsData = await barrelsResponse.json()
          // Filtrar apenas barrils ativos
          const activeBarrels = barrelsData.filter((barrel: Barrel) => barrel.status === 'ACTIVE')
          setBarrels(activeBarrels)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          cost: parseFloat(formData.cost),
          minQuantity: parseInt(formData.minQuantity),
          maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : null,
          volumeRetiradaMl: formData.volumeRetiradaMl ? parseInt(formData.volumeRetiradaMl) : null,
          barrelId: formData.barrelId || null,
        }),
      })

      if (response.ok) {
        router.push("/products")
      } else {
        const data = await response.json()
        alert(data.error || "Erro ao criar produto")
      }
    } catch (error) {
      console.error("Erro ao criar produto:", error)
      alert("Erro ao criar produto")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link
          href="/products"
          className="mr-4 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={24} />
        </Link>
      </div>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: Cerveja Skol"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                    Categoria *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-300 mb-2">
                    Unidade *
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.unit}
                    onChange={handleChange}
                  >
                    <option value="">Selecione a unidade</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.name}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-gray-300 mb-2">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    id="barcode"
                    name="barcode"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Opcional"
                    value={formData.barcode}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Seção de Tipo de Produto */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tipo de Produto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="productType" className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo *
                    </label>
                    <select
                      id="productType"
                      name="productType"
                      required
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.productType}
                      onChange={handleChange}
                    >
                      <option value="UNIT">Produto Unitário</option>
                      <option value="FRACTIONED">Produto Fracionado</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Fracionado: vendido por volume (ml) de um barril
                    </p>
                  </div>

                  {formData.productType === 'FRACTIONED' && (
                    <>
                      <div>
                        <label htmlFor="volumeRetiradaMl" className="block text-sm font-medium text-gray-300 mb-2">
                          Volume por Retirada (ml) *
                        </label>
                        <input
                          type="number"
                          id="volumeRetiradaMl"
                          name="volumeRetiradaMl"
                          required
                          min="50"
                          step="50"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="300"
                          value={formData.volumeRetiradaMl}
                          onChange={handleChange}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Ex: 300ml, 500ml, 1000ml
                        </p>
                      </div>

                      <div>
                        <label htmlFor="barrelId" className="block text-sm font-medium text-gray-300 mb-2">
                          Barril *
                        </label>
                        <select
                          id="barrelId"
                          name="barrelId"
                          required
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formData.barrelId}
                          onChange={handleChange}
                        >
                          <option value="">Selecione um barril</option>
                          {barrels.map((barrel) => (
                            <option key={barrel.id} value={barrel.id}>
                              {barrel.name} - {Math.round(barrel.volumeDisponivelMl / 1000)}L disponível
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                          Barril ativo com volume disponível
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Seção de Estoque (apenas para produtos unitários) */}
              {formData.productType === 'UNIT' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Controle de Estoque</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-300 mb-2">
                        Estoque Mínimo
                      </label>
                      <input
                        type="number"
                        id="minQuantity"
                        name="minQuantity"
                        min="0"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.minQuantity}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="maxQuantity" className="block text-sm font-medium text-gray-300 mb-2">
                        Estoque Máximo
                      </label>
                      <input
                        type="number"
                        id="maxQuantity"
                        name="maxQuantity"
                        min="0"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.maxQuantity}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Descrição opcional do produto"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Preços</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cost" className="block text-sm font-medium text-gray-300 mb-2">
                    Custo de Compra *
                  </label>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                    Preço de Venda *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>


            <div className="flex justify-end space-x-4">
              <Link
                href="/products"
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} className="mr-2" />
                {loading ? "Salvando..." : "Salvar Produto"}
              </button>
            </div>
          </form>
        </div>
    </div>
  )
}
