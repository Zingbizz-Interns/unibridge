import { AdminShell } from '@/components/admin/AdminShell'
import { requireAuth } from '@/lib/session'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth(['admin'])
  const userLabel = user.name || user.email || 'Admin'

  return <AdminShell userLabel={userLabel}>{children}</AdminShell>
}
