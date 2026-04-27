import type { Metadata } from 'next'
import { GraduationCap } from 'lucide-react'
import { exams } from './data'
import ExamsClient from './ExamsClient'

export const metadata: Metadata = {
  title: 'Entrance Exams | UniBridge',
  description:
    'Explore every major entrance exam — Engineering, Medical, Management, Law, Design, Agriculture and Commerce. Official registration links, free mock tests and study resources in one place.',
}

export default function ExamsPage() {
  return (
    <main className="min-h-screen bg-md-surface">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-12 pb-10">
        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-md-primary/7 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/4 h-[360px] w-[360px] rounded-full bg-md-tertiary/5 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-1/3 h-[280px] w-[280px] rounded-full bg-md-primary/5 blur-2xl"
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
          {/* Eyebrow pill */}
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-md-primary/10 px-4 py-1.5 animate-page-enter"
            style={{ animationDelay: '0ms' }}
          >
            <GraduationCap className="h-3.5 w-3.5 text-md-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-md-primary">
              Entrance Exam Hub
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-md-on-surface leading-tight mb-4 animate-page-enter"
            style={{ animationDelay: '80ms' }}
          >
            Your gateway to{' '}
            <span className="text-md-primary">every dream course</span>
          </h1>

          {/* Sub-headline */}
          <p
            className="text-base sm:text-lg text-md-on-surface-variant max-w-2xl mx-auto mb-6 animate-page-enter"
            style={{ animationDelay: '160ms' }}
          >
            Official registration links, free mock tests and study resources for
            Engineering, Medical, Management, Law, Design, Agriculture and
            Commerce — all in one place.
          </p>

          {/* Quick-stat pills */}
          <div
            className="flex flex-wrap justify-center gap-3 animate-page-enter"
            style={{ animationDelay: '240ms' }}
          >
            {[
              { label: '22+ Exams', sub: 'covered' },
              { label: '7 Streams', sub: 'across all domains' },
              { label: 'Official Links', sub: 'direct registration' },
              { label: 'Free Resources', sub: 'mock tests & guides' },
            ].map(({ label, sub }) => (
              <div
                key={label}
                className="rounded-2xl bg-md-surface-container px-4 py-2.5 text-center"
              >
                <p className="text-sm font-semibold text-md-on-surface">{label}</p>
                <p className="text-xs text-md-on-surface-variant/60">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filter + Cards (client) ── */}
      <ExamsClient exams={exams} />
    </main>
  )
}
