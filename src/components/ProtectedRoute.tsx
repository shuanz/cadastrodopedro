"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

interface ExtendedUser {
  id: string
  name?: string | null
  email?: string | null
  role?: string
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
      return
    }

    if (requireAdmin && (session.user as ExtendedUser)?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
  }, [session, status, router, requireAdmin])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (requireAdmin && (session.user as ExtendedUser)?.role !== "ADMIN") {
    return null
  }

  return <>{children}</>
}
