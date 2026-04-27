'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Search, ChevronDown, Bell, Menu, X, Cog, Briefcase, HeartPulse, BarChart2, Scale, Palette, PenTool, Leaf, LogOut, LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const goals: { label: string; Icon: LucideIcon; href: string }[] = [
  { label: 'Engineering', Icon: Cog, href: '/colleges?category=engineering' },
  { label: 'Management', Icon: Briefcase, href: '/colleges?stream=Management' },
  { label: 'Medical', Icon: HeartPulse, href: '/colleges?category=medical' },
  { label: 'Commerce', Icon: BarChart2, href: '/colleges?stream=Commerce' },
  { label: 'Law', Icon: Scale, href: '/colleges?stream=Law' },
  { label: 'Arts & Science', Icon: Palette, href: '/colleges?category=arts_science' },
  { label: 'Design', Icon: PenTool, href: '/colleges?stream=Design' },
  { label: 'Agriculture', Icon: Leaf, href: '/colleges?stream=Agriculture' },
]

const exploreMenu = [
  { label: 'Top Colleges', href: '/colleges' },
  { label: 'Compare Colleges', href: '/compare' },
  { label: 'Exams', href: '/exams' },
  { label: 'News & Articles', href: '#' },
]

const dashboardHref: Record<string, string> = {
  student: '/dashboard',
  college: '/college/dashboard',
  admin: '/admin/dashboard',
}

export default function HomeNav({ userName, userRole }: { userName?: string; userRole?: string }) {
  const router = useRouter()
  const [goalOpen, setGoalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState('')
  const [exploreOpen, setExploreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const goalRef = useRef<HTMLDivElement>(null)
  const exploreRef = useRef<HTMLDivElement>(null)
  const userInitial = userName ? userName.trim()[0].toUpperCase() : 'G'

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (goalRef.current && !goalRef.current.contains(e.target as Node)) setGoalOpen(false)
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setExploreOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full bg-md-surface/95 backdrop-blur-md border-b border-md-outline/10 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-md-primary text-md-on-primary text-sm font-bold shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105 active:scale-95">
              U
            </span>
            <span className="hidden sm:block text-lg font-medium text-md-on-surface">
              Uni<span className="text-md-primary">Bridge</span>
            </span>
          </Link>

          {/* Select Goal Dropdown */}
          <div ref={goalRef} className="relative hidden md:block shrink-0">
            <button
              onClick={() => setGoalOpen(!goalOpen)}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-md-on-surface-variant border border-md-outline/30 hover:bg-md-primary/10 hover:border-md-primary/40 hover:text-md-primary transition-all duration-200 active:scale-95"
            >
              <span>{selectedGoal || 'Select Goal'}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${goalOpen ? 'rotate-180' : ''}`} />
            </button>
            {goalOpen && (
              <div className="absolute top-full mt-2 left-0 w-52 rounded-2xl bg-md-surface shadow-xl border border-md-outline/10 overflow-hidden z-50 origin-top scale-in">
                <div className="py-1">
                  {goals.map((g) => (
                    <button
                      key={g.label}
                      onClick={() => { setSelectedGoal(g.label); setGoalOpen(false); router.push(g.href) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-md-on-surface hover:bg-md-primary/10 hover:text-md-primary transition-colors duration-150 active:scale-95"
                    >
                      <g.Icon className="h-4 w-4 shrink-0" />
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-md-on-surface-variant pointer-events-none" />
              <input
                type="text"
                placeholder="Search for Colleges, Exams, Courses and More…"
                className="w-full h-10 pl-10 pr-4 rounded-full bg-md-surface-container border border-md-outline/20 text-sm text-md-on-surface placeholder:text-md-on-surface-variant/50 focus:outline-none focus:border-md-primary focus:ring-1 focus:ring-md-primary transition-all duration-200"
              />
            </div>
          </div>

          {/* Right items */}
          <div className="flex items-center gap-1.5 ml-auto md:ml-0">

            {/* Explore dropdown */}
            <div ref={exploreRef} className="relative hidden md:block">
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-md-on-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-all duration-200 active:scale-95"
              >
                Explore
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${exploreOpen ? 'rotate-180' : ''}`} />
              </button>
              {exploreOpen && (
                <div className="absolute top-full mt-2 right-0 w-52 rounded-2xl bg-md-surface shadow-xl border border-md-outline/10 overflow-hidden z-50 origin-top scale-in">
                  <div className="py-1">
                    {exploreMenu.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setExploreOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-md-on-surface hover:bg-md-primary/10 hover:text-md-primary transition-colors duration-150"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-md-on-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-all duration-200 active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-md-tertiary border-2 border-md-surface" />
            </button>

            {/* Profile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 bg-md-surface-container hover:bg-md-surface-container-high border border-md-outline/20 transition-all duration-200 active:scale-95"
              aria-label="Profile menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-md-primary/15 text-md-primary text-xs font-semibold select-none">
                {userInitial}
              </span>
              {mobileOpen
                ? <X className="h-4 w-4 text-md-on-surface-variant" />
                : <Menu className="h-4 w-4 text-md-on-surface-variant" />
              }
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-md-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Search for Colleges, Exams, Courses…"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-md-surface-container border border-md-outline/20 text-sm text-md-on-surface placeholder:text-md-on-surface-variant/50 focus:outline-none focus:border-md-primary transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Mobile / Profile dropdown */}
      {mobileOpen && (
        <div className="border-t border-md-outline/10 bg-md-surface px-4 pb-5 z-40">
          <div className="pt-4 space-y-1">
            {userName ? (
              <>
                {/* Logged-in user profile row */}
                <div className="flex items-center gap-3 rounded-2xl bg-md-primary/8 px-4 py-3 mb-1">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-md-primary/15 text-md-primary text-sm font-semibold select-none">
                    {userInitial}
                  </span>
                  <span className="text-sm font-medium text-md-on-surface truncate">{userName}</span>
                </div>
                {userRole && dashboardHref[userRole] && (
                  <Link
                    href={dashboardHref[userRole]}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-md-on-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/login' }) }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors active:scale-95"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center rounded-2xl bg-md-primary px-4 py-3 text-sm font-medium text-md-on-primary hover:bg-md-primary/90 transition-colors"
              >
                Login
              </Link>
            )}
            <div className="border-t border-md-outline/10 my-2 pt-1">
              <p className="px-4 py-1.5 text-xs font-medium text-md-on-surface-variant uppercase tracking-wider">Explore</p>
              {exploreMenu.map(item => (
                <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center rounded-2xl px-4 py-3 text-sm text-md-on-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
