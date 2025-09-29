"use client"

import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  LogOut,
  Menu,
  X,
  Settings
} from "lucide-react"

interface ExtendedUser {
  id: string
  name?: string | null
  email?: string | null
  role?: string
}

interface LayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: LayoutProps) {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: TrendingUp },
  { name: "Produtos", href: "/products", icon: Package },
  { name: "Estoque", href: "/inventory", icon: Package },
  { name: "Barrils", href: "/barrels", icon: Package, adminOnly: true },
  { name: "Vendas", href: "/sales", icon: ShoppingCart },
  { name: "Usuários", href: "/users", icon: Users, adminOnly: true },
  { name: "Configurações", href: "/settings", icon: Settings, adminOnly: true },
]

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || (session?.user as ExtendedUser)?.role === "ADMIN"
  )

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gray-700">
          <h1 className="text-xl font-bold text-white">Cadastro do Pedro</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="mt-8">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-6 py-3 transition-colors ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">{session?.user?.name}</p>
              <p className="text-xs text-gray-500">{(session?.user as ExtendedUser)?.role}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-gray-400 hover:text-white"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-gray-800 shadow">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
        <h2 className="text-2xl font-bold text-white">
          {pathname === '/dashboard' && 'Dashboard'}
          {pathname === '/products' && 'Produtos'}
          {pathname === '/inventory' && 'Estoque'}
          {pathname === '/barrels' && 'Barrils'}
          {pathname === '/sales' && 'Vendas'}
          {pathname === '/users' && 'Usuários'}
          {pathname === '/settings' && 'Configurações'}
          {pathname.startsWith('/products/new') && 'Novo Produto'}
          {pathname.startsWith('/products/') && pathname.includes('/edit') && 'Editar Produto'}
          {pathname === '/sales/history' && 'Histórico de Vendas'}
        </h2>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Bem-vindo, {session?.user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
