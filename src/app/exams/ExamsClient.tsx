'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search,
  X,
  ExternalLink,
  ClipboardList,
  BookOpen,
  ChevronDown,
  BookMarked,
} from 'lucide-react'
import type { Exam, Stream } from './data'
import { streams } from './data'

// ── Stream colour tokens ────────────────────────────────────────────────────
const streamBadge: Record<string, string> = {
  engineering: 'bg-blue-50   text-blue-700   border-blue-200',
  medical:     'bg-rose-50   text-rose-700   border-rose-200',
  management:  'bg-amber-50  text-amber-700  border-amber-200',
  law:         'bg-violet-50 text-violet-700 border-violet-200',
  design:      'bg-pink-50   text-pink-700   border-pink-200',
  agriculture: 'bg-green-50  text-green-700  border-green-200',
  commerce:    'bg-orange-50 text-orange-700 border-orange-200',
}

const streamChipActive: Record<string, string> = {
  All:         'bg-md-primary        text-md-on-primary   border-md-primary',
  Engineering: 'bg-blue-600          text-white            border-blue-600',
  Medical:     'bg-rose-600          text-white            border-rose-600',
  Management:  'bg-amber-500         text-white            border-amber-500',
  Law:         'bg-violet-600        text-white            border-violet-600',
  Design:      'bg-pink-600          text-white            border-pink-600',
  Agriculture: 'bg-green-600         text-white            border-green-600',
  Commerce:    'bg-orange-500        text-white            border-orange-500',
}

// ── Reveal-on-scroll wrapper ────────────────────────────────────────────────
function RevealCard({
  children,
  delay,
}: {
  children: React.ReactNode
  delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    let timer: ReturnType<typeof setTimeout>
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.06 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [delay])

  return (
    <div
      ref={ref}
      className="transition-all duration-500 will-change-transform"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      {children}
    </div>
  )
}

// ── Expandable link section ─────────────────────────────────────────────────
function ExpandLinks({
  title,
  links,
  icon: Icon,
}: {
  title: string
  links: { label: string; href: string }[]
  icon: React.ElementType
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-md-outline/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary transition-colors duration-150 active:scale-[0.98]"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" />
          {title}
          <span className="text-xs opacity-50">({links.length})</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Accordion body */}
      <div
        className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
        style={{ maxHeight: open ? `${links.length * 56 + 16}px` : '0px' }}
      >
        <div className="px-4 pb-3 space-y-1.5">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-md-primary bg-md-primary/5 hover:bg-md-primary/10 transition-all duration-150 group/link active:scale-[0.98]"
            >
              <span className="flex-1 truncate">{link.label}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 transition-all duration-150" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Single exam card ────────────────────────────────────────────────────────
function ExamCard({ exam, index }: { exam: Exam; index: number }) {
  const primary = exam.streams[0]
  const badge = streamBadge[primary] ?? 'bg-md-surface-container text-md-on-surface-variant border-md-outline/20'

  return (
    <RevealCard delay={(index % 6) * 65}>
      <article className="group flex flex-col h-full rounded-[24px] bg-md-surface border border-md-outline/10 shadow-sm hover:shadow-xl motion-safe:hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
        {/* Card body */}
        <div className="p-5 flex-1">
          {/* Badges row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1.5">
              {exam.streams.map((s) => (
                <span
                  key={s}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${badge}`}
                >
                  {s}
                </span>
              ))}
            </div>
            {exam.featured && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-md-primary/10 px-2.5 py-0.5 text-xs font-semibold text-md-primary">
                Popular
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="text-lg font-bold text-md-on-surface group-hover:text-md-primary transition-colors duration-200 mb-0.5 leading-snug">
            {exam.name}
          </h3>
          <p className="text-xs text-md-on-surface-variant/70 mb-4 leading-relaxed">
            {exam.fullForm}
          </p>

          {/* Info rows */}
          <dl className="space-y-2">
            <div className="flex items-start gap-2">
              <dt className="shrink-0 w-24 text-xs text-md-on-surface-variant/55">Conducted by</dt>
              <dd className="text-xs text-md-on-surface font-medium leading-tight">{exam.conductingBody}</dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="shrink-0 w-24 text-xs text-md-on-surface-variant/55">Eligibility</dt>
              <dd className="text-xs text-md-on-surface leading-tight">{exam.eligibility}</dd>
            </div>
          </dl>

          {/* Frequency + months tags */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full bg-md-surface-container px-2.5 py-1 text-xs text-md-on-surface-variant">
              {exam.frequency}
            </span>
            <span className="inline-flex items-center rounded-full bg-md-surface-container px-2.5 py-1 text-xs text-md-on-surface-variant">
              {exam.examMonths}
            </span>
          </div>
        </div>

        {/* Official site */}
        <div className="border-t border-md-outline/10">
          <a
            href={exam.officialSite}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-md-primary hover:bg-md-primary/5 transition-colors duration-150 group/official active:scale-[0.98]"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            Official Registration Site
            <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-0 group-hover/official:opacity-100 group-hover/official:translate-x-0.5 transition-all duration-150" />
          </a>
        </div>

        {exam.mockTests.length > 0 && (
          <ExpandLinks title="Mock Tests" links={exam.mockTests} icon={ClipboardList} />
        )}
        {exam.resources.length > 0 && (
          <ExpandLinks title="Study Resources" links={exam.resources} icon={BookOpen} />
        )}
      </article>
    </RevealCard>
  )
}

// ── Main client component ───────────────────────────────────────────────────
export default function ExamsClient({ exams }: { exams: Exam[] }) {
  const [activeStream, setActiveStream] = useState<Stream>('All')
  const [search, setSearch] = useState('')
  const [gridKey, setGridKey] = useState(0)

  const filtered = exams.filter((exam) => {
    const matchStream =
      activeStream === 'All' ||
      exam.streams.includes(activeStream.toLowerCase())
    const q = search.toLowerCase().trim()
    const matchSearch =
      !q ||
      exam.name.toLowerCase().includes(q) ||
      exam.fullForm.toLowerCase().includes(q) ||
      exam.conductingBody.toLowerCase().includes(q)
    return matchStream && matchSearch
  })

  const handleStream = (s: Stream) => {
    setActiveStream(s)
    setGridKey((k) => k + 1)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
      {/* ── Search bar ── */}
      <div
        className="mb-6 animate-page-enter"
        style={{ animationDelay: '240ms' }}
      >
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-md-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exams, full forms or conducting body…"
            className="w-full h-12 pl-11 pr-10 rounded-full bg-md-surface-container border border-md-outline/20 text-sm text-md-on-surface placeholder:text-md-on-surface-variant/50 focus:outline-none focus:border-md-primary focus:ring-1 focus:ring-md-primary transition-all duration-200 md-input-glow"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-md-surface-container-high text-md-on-surface-variant hover:bg-md-outline/20 transition-colors active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Stream filter chips ── */}
      <div
        className="mb-8 -mx-4 sm:mx-0 animate-page-enter"
        style={{ animationDelay: '320ms' }}
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 sm:px-0 sm:flex-wrap">
          {streams.map((s, i) => {
            const isActive = activeStream === s
            return (
              <button
                key={s}
                onClick={() => handleStream(s)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200 motion-safe:active:scale-95 animate-page-enter ${
                  isActive
                    ? (streamChipActive[s] ?? 'bg-md-primary text-md-on-primary border-md-primary') + ' shadow-sm'
                    : 'bg-md-surface-container text-md-on-surface-variant border-md-outline/20 hover:bg-md-primary/10 hover:text-md-primary hover:border-md-primary/30'
                }`}
                style={{ animationDelay: `${320 + i * 45}ms` }}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Results count ── */}
      <p
        className="mb-6 text-sm text-md-on-surface-variant animate-page-enter"
        style={{ animationDelay: '480ms' }}
      >
        {filtered.length === 0
          ? 'No exams found'
          : `${filtered.length} exam${filtered.length !== 1 ? 's' : ''}`}
        {activeStream !== 'All' && ` · ${activeStream}`}
        {search.trim() && ` · matching "${search.trim()}"`}
      </p>

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center animate-page-enter">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-md-primary/10">
            <BookMarked className="h-9 w-9 text-md-primary/50" />
          </div>
          <p className="text-md-on-surface text-lg font-semibold mb-1">No exams found</p>
          <p className="text-md-on-surface-variant/60 text-sm">
            Try a different stream or clear the search
          </p>
          <button
            onClick={() => { setSearch(''); handleStream('All') }}
            className="mt-6 rounded-full bg-md-primary px-6 py-2.5 text-sm font-medium text-md-on-primary hover:bg-md-primary/90 transition-colors active:scale-95"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* ── Cards grid ── */
        <div
          key={gridKey}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in"
        >
          {filtered.map((exam, i) => (
            <ExamCard key={exam.id} exam={exam} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
