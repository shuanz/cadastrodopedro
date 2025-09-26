import ProtectedRoute from "@/components/ProtectedRoute"
import AppLayout from "@/components/AppLayout"

export default function InventoryLayout({
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
