'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, LayoutDashboard, Menu, School, ShieldCheck, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import LogoutButton from '@/components/shared/LogoutButton'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/admin/colleges', label: 'Colleges', icon: School },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/students', label: 'Students', icon: Users },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminShell({
  userLabel,
  children,
}: {
  userLabel: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-md-surface">
      <div className="sticky top-0 z-30 border-b border-md-outline/10 bg-md-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-md-primary">
              Admin Panel
            </p>
            <p className="text-sm text-md-on-surface-variant">{userLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <LogoutButton />
            <Button
              type="button"
              variant="outline"
            size="icon"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-72 border-r border-md-outline/10 bg-md-surface-container p-5 shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:rounded-3xl lg:border lg:shadow-sm',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="hidden border-b border-md-outline/10 pb-5 lg:block">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-md-primary">
              Admin Panel
            </p>
            <p className="mt-2 text-lg font-semibold text-md-on-surface">{userLabel}</p>
            <p className="text-sm text-md-on-surface-variant">
              Platform operations and analytics
            </p>
          </div>

          <nav className="mt-8 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActivePath(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-md-primary text-md-on-primary shadow-sm'
                      : 'text-md-on-surface-variant hover:bg-md-surface hover:text-md-on-surface'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-md-outline/10 pt-4">
            <LogoutButton className="w-full justify-start" />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
