import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { getDashboardPath } from '@/lib/dashboard'
import LogoutButton from '@/components/shared/LogoutButton'

const studentLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/applications', label: 'Applications' },
  { href: '/colleges', label: 'Explore' },
  { href: '/compare', label: 'Compare' },
]

const collegeLinks = [
  { href: '/college/dashboard', label: 'Dashboard' },
  { href: '/college/courses', label: 'Courses' },
  { href: '/college/applications', label: 'Applicants' },
  { href: '/college/enquiries', label: 'Enquiries' },
  { href: '/college/placements/drives', label: 'Placements' },
  { href: '/college/settings', label: 'Settings' },
]

const adminLinks = [
  { href: '/admin/dashboard', label: 'Overview' },
  { href: '/admin/verifications', label: 'Verifications' },
  { href: '/admin/colleges', label: 'Colleges' },
  { href: '/admin/analytics', label: 'Analytics' },
]

function linksForRole(role?: string) {
  switch (role) {
    case 'student':
      return studentLinks
    case 'college':
      return collegeLinks
    case 'admin':
      return adminLinks
    default:
      return []
  }
}

export default async function AppHeader() {
  const user = await getCurrentUser()

  if (!user) return null

  const links = linksForRole(user.role)
  const dashboardHref = getDashboardPath(user.role)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-md-outline/10 bg-md-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-medium text-md-primary transition-colors hover:text-md-primary/80"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-md-primary text-md-on-primary text-sm font-bold shadow-sm">
            U
          </span>
          <span className="hidden sm:inline">UniBridge</span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-md-on-surface-variant transition-all duration-300 hover:bg-md-primary/10 hover:text-md-primary active:scale-95"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="hidden lg:inline text-sm text-md-on-surface-variant truncate max-w-[160px]">
            {user.name}
          </span>
          <span className="hidden lg:inline rounded-full bg-md-secondary-container px-3 py-1 text-xs font-medium text-md-on-secondary-container capitalize">
            {user.role}
          </span>
          <LogoutButton />
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex md:hidden overflow-x-auto border-t border-md-outline/5 bg-md-surface-container px-2 py-1.5 gap-1 scrollbar-none">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-md-on-surface-variant transition-all duration-300 hover:bg-md-primary/10 hover:text-md-primary active:scale-95"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
