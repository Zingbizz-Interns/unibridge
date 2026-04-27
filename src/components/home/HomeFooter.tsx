import Link from 'next/link'
import { Globe, Camera, Bird, Play } from 'lucide-react'

const footerLinks = [
  {
    title: 'Explore',
    links: [
      { label: 'Top Colleges', href: '/colleges' },
      { label: 'Compare Colleges', href: '/compare' },
      { label: 'Courses', href: '#' },
      { label: 'Exams', href: '#' },
      { label: 'Scholarships', href: '#' },
    ],
  },
  {
    title: 'Study Goals',
    links: [
      { label: 'Engineering', href: '/colleges?goal=engineering' },
      { label: 'Management', href: '/colleges?goal=management' },
      { label: 'Medical', href: '/colleges?goal=medical' },
      { label: 'Commerce', href: '/colleges?goal=commerce' },
      { label: 'Law', href: '/colleges?goal=law' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign In', href: '/login' },
      { label: 'Register as Student', href: '/register/student' },
      { label: 'Register as College', href: '/register/college' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
]

const socialLinks = [
  { Icon: Globe, label: 'Facebook', href: '#' },
  { Icon: Camera, label: 'Instagram', href: '#' },
  { Icon: Bird, label: 'Twitter', href: '#' },
  { Icon: Play, label: 'YouTube', href: '#' },
]

export default function HomeFooter() {
  return (
    <footer className="bg-md-on-surface">
      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-10">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-md-primary text-md-on-primary text-sm font-bold">
                U
              </span>
              <span className="text-lg font-medium text-white">
                Uni<span className="text-md-primary">Bridge</span>
              </span>
            </Link>
            <p className="text-sm text-white/45 leading-relaxed max-w-[220px]">
              India&apos;s college discovery &amp; admission platform. Explore, compare, and apply.
            </p>
            <div className="mt-5 flex gap-3">
              {socialLinks.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/60 hover:bg-white/15 hover:text-white transition-all duration-200"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-medium text-white/70 mb-4 tracking-wide">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/38 hover:text-white/75 transition-colors duration-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/28">
            © {new Date().getFullYear()} UniBridge. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((l) => (
              <a key={l} href="#" className="text-xs text-white/28 hover:text-white/55 transition-colors duration-200">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
