import ProtectedRoute from "@/components/ProtectedRoute"
import AppLayout from "@/components/AppLayout"

export default function BarrelsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <AppLayout>
        {children}
      </AppLayout>
    </ProtectedRoute>
  )
}
