import ProtectedRoute from "@/components/ProtectedRoute"
import AppLayout from "@/components/AppLayout"

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AppLayout>
        {children}
      </AppLayout>
    </ProtectedRoute>
  )
}
