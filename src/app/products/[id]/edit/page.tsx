"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

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
    minQuantity: number
    maxQuantity: number | null
  }
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
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
    isActive: true,
  })

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setProduct(data)
          setFormData({
            name: data.name,
            description: data.description || "",
            price: data.price.toString(),
            cost: data.cost.toString(),
            category: data.category,
            unit: data.unit,
            barcode: data.barcode || "",
            minQuantity: data.inventory?.minQuantity?.toString() || "0",
            maxQuantity: data.inventory?.maxQuantity?.toString() || "",
            isActive: data.isActive,
          })
        } else {
          router.push("/products")
        }
      } catch (error) {
        console.error("Erro ao buscar produto:", error)
        router.push("/products")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, router])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          cost: parseFloat(formData.cost),
          minQuantity: parseInt(formData.minQuantity),
          maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : null,
        }),
      })

      if (response.ok) {
        router.push("/products")
      } else {
        const data = await response.json()
        alert(data.error || "Erro ao atualizar produto")
      }
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      alert("Erro ao atualizar produto")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando produto...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Produto não encontrado</div>
      </div>
    )
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
                    <option value="Bebidas">Bebidas</option>
                    <option value="Comidas">Comidas</option>
                    <option value="Petiscos">Petiscos</option>
                    <option value="Doces">Doces</option>
                    <option value="Outros">Outros</option>
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
                    <option value="unidade">Unidade</option>
                    <option value="kg">Quilograma</option>
                    <option value="g">Grama</option>
                    <option value="litro">Litro</option>
                    <option value="ml">Mililitro</option>
                    <option value="caixa">Caixa</option>
                    <option value="pacote">Pacote</option>
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

              <div className="mt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-gray-300">Produto ativo</span>
                </label>
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

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Controle de Estoque</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-300 mb-2">
                    Estoque Mínimo *
                  </label>
                  <input
                    type="number"
                    id="minQuantity"
                    name="minQuantity"
                    min="0"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
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
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Opcional"
                    value={formData.maxQuantity}
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
                disabled={saving}
                className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} className="mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
    </div>
  )
}
