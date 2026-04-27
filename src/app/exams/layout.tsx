import AppHeader from '@/components/shared/AppHeader'
import HomeFooter from '@/components/home/HomeFooter'

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-md-surface">
      <AppHeader />
      {children}
      <HomeFooter />
    </div>
  )
}
