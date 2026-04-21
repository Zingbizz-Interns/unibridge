import AppHeader from '@/components/shared/AppHeader'

export default function CollegesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-md-surface">
      <AppHeader />
      {children}
    </div>
  )
}
