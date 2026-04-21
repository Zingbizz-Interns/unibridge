import Link from 'next/link'
import { Cog, Briefcase, BarChart2, Palette, HeartPulse, Scale } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const goals: {
  Icon: LucideIcon
  title: string
  subtitle: string
  courses: string[]
  bg: string
  iconColor: string
  href: string
}[] = [
  {
    Icon: Cog,
    title: 'Engineering',
    subtitle: '6,368 Colleges',
    courses: ['BE/B.Tech', 'ME/M.Tech', 'Diploma'],
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    href: '/colleges?goal=engineering',
  },
  {
    Icon: Briefcase,
    title: 'Management',
    subtitle: '4,512 Colleges',
    courses: ['MBA', 'BBA', 'PGDM'],
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    href: '/colleges?goal=management',
  },
  {
    Icon: BarChart2,
    title: 'Commerce',
    subtitle: '3,200 Colleges',
    courses: ['B.Com', 'M.Com', 'CA'],
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    href: '/colleges?goal=commerce',
  },
  {
    Icon: Palette,
    title: 'Arts',
    subtitle: '2,890 Colleges',
    courses: ['BA', 'MA', 'BFA'],
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    href: '/colleges?goal=arts',
  },
  {
    Icon: HeartPulse,
    title: 'Medical',
    subtitle: '1,850 Colleges',
    courses: ['MBBS', 'BDS', 'BAMS'],
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    href: '/colleges?goal=medical',
  },
  {
    Icon: Scale,
    title: 'Law',
    subtitle: '980 Colleges',
    courses: ['LLB', 'BA LLB', 'LLM'],
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    href: '/colleges?goal=law',
  },
]

export default function StudyGoalSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      {/* Section heading */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-medium text-md-on-surface">
          Select Your Study Goal
        </h2>
        <p className="mt-3 text-md-on-surface-variant max-w-md mx-auto leading-relaxed">
          Choose your stream to discover the best colleges and courses tailored for you.
        </p>
      </div>

      {/* Goal cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {goals.map((g) => (
          <Link
            key={g.title}
            href={g.href}
            className="group flex flex-col items-center rounded-3xl bg-md-surface-container p-5 shadow-sm hover:shadow-md hover:scale-[1.04] hover:bg-md-surface transition-all duration-300 active:scale-95 cursor-pointer"
          >
            {/* Icon */}
            <div
              className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full ${g.bg} ${g.iconColor} transition-transform duration-300 group-hover:scale-110`}
            >
              <g.Icon className="h-7 w-7" />
            </div>

            {/* Title */}
            <h3 className="font-medium text-md-on-surface text-center text-sm leading-snug">
              {g.title}
            </h3>

            {/* Count */}
            <p className="text-xs text-md-on-surface-variant mt-0.5 text-center">
              {g.subtitle}
            </p>

            {/* Course tags */}
            <div className="mt-3 flex flex-wrap gap-1 justify-center">
              {g.courses.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-md-secondary-container px-2 py-0.5 text-[10px] font-medium text-md-on-secondary-container group-hover:bg-md-primary/10 group-hover:text-md-primary transition-colors duration-200"
                >
                  {c}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* View all link */}
      <div className="mt-8 text-center">
        <Link
          href="/colleges"
          className="inline-flex rounded-full border border-md-outline/30 px-6 py-2.5 text-sm font-medium text-md-on-surface-variant hover:bg-md-primary/10 hover:text-md-primary hover:border-md-primary/30 transition-all duration-200 active:scale-95"
        >
          View All Study Streams →
        </Link>
      </div>
    </section>
  )
}
