'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, X, ExternalLink, BookOpen, ArrowRight, Calendar, Clock } from 'lucide-react'
import type { Article, CategoryFilter } from './data'
import { categories } from './data'

// ── Category colour tokens ──────────────────────────────────────────────────
const categoryBadge: Record<string, string> = {
  admissions:   'bg-blue-50   text-blue-700   border-blue-200',
  policy:       'bg-violet-50 text-violet-700 border-violet-200',
  rankings:     'bg-amber-50  text-amber-700  border-amber-200',
  scholarships: 'bg-green-50  text-green-700  border-green-200',
  career:       'bg-orange-50 text-orange-700 border-orange-200',
  'study-tips': 'bg-rose-50   text-rose-700   border-rose-200',
}

const categoryChipActive: Record<string, string> = {
  All:          'bg-md-primary        text-md-on-primary border-md-primary',
  Admissions:   'bg-blue-600          text-white         border-blue-600',
  Policy:       'bg-violet-600        text-white         border-violet-600',
  Rankings:     'bg-amber-500         text-white         border-amber-500',
  Scholarships: 'bg-green-600         text-white         border-green-600',
  Career:       'bg-orange-500        text-white         border-orange-500',
  'Study Tips': 'bg-rose-600          text-white         border-rose-600',
}

const categoryGradient: Record<string, string> = {
  admissions:   'from-blue-600   to-blue-800',
  policy:       'from-violet-600 to-violet-800',
  rankings:     'from-amber-500  to-amber-700',
  scholarships: 'from-green-600  to-green-800',
  career:       'from-orange-500 to-orange-700',
  'study-tips': 'from-rose-500   to-rose-700',
}

const categoryLabel: Record<string, string> = {
  admissions:   'Admissions',
  policy:       'Policy',
  rankings:     'Rankings',
  scholarships: 'Scholarships',
  career:       'Career',
  'study-tips': 'Study Tips',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Reveal-on-scroll wrapper ────────────────────────────────────────────────
function RevealCard({ children, delay }: { children: React.ReactNode; delay: number }) {
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

// ── Featured article banner ─────────────────────────────────────────────────
function FeaturedBanner({ article }: { article: Article }) {
  const gradient = categoryGradient[article.category] ?? 'from-md-primary to-violet-700'
  const isExternal = !!article.externalUrl
  const href = isExternal ? article.externalUrl! : `/news/${article.slug}`

  return (
    <div
      className="mb-10 animate-page-enter rounded-[28px] overflow-hidden shadow-lg"
      style={{ animationDelay: '360ms' }}
    >
      <div className={`relative bg-gradient-to-br ${gradient} p-8 sm:p-10 md:p-12`}>
        {/* Decorative circles */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative max-w-3xl">
          {/* Top row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white uppercase tracking-wide">
              Featured
            </span>
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
              {categoryLabel[article.category]}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-snug mb-3">
            {article.title}
          </h2>

          {/* Excerpt */}
          <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl">
            {article.excerpt}
          </p>

          {/* Meta + CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-white/65">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(article.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {article.readTime}
              </span>
            </div>
            <a
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-white/90 active:scale-95 transition-all duration-200 shadow-sm"
            >
              Read Article
              {isExternal ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Article card ────────────────────────────────────────────────────────────
function ArticleCard({ article, index }: { article: Article; index: number }) {
  const badge = categoryBadge[article.category] ?? 'bg-md-surface-container text-md-on-surface-variant border-md-outline/20'
  const isExternal = !!article.externalUrl
  const href = isExternal ? article.externalUrl! : `/news/${article.slug}`

  return (
    <RevealCard delay={(index % 6) * 65}>
      <article className="group flex flex-col h-full rounded-[24px] bg-md-surface border border-md-outline/10 shadow-sm hover:shadow-xl motion-safe:hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
        {/* Card body */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Category badge */}
          <div className="mb-3">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${badge}`}>
              {categoryLabel[article.category]}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-md-on-surface group-hover:text-md-primary transition-colors duration-200 mb-2 leading-snug line-clamp-3 flex-1">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-md-on-surface-variant/70 leading-relaxed line-clamp-2 mb-4">
            {article.excerpt}
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between gap-2 text-xs text-md-on-surface-variant/55 mt-auto">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(article.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readTime}
              </span>
            </div>
            {article.source && (
              <span className="shrink-0 text-xs text-md-on-surface-variant/45 truncate max-w-[100px]">
                {article.source}
              </span>
            )}
          </div>
        </div>

        {/* CTA footer */}
        <div className="border-t border-md-outline/10">
          <a
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-md-primary hover:bg-md-primary/5 transition-colors duration-150 group/cta active:scale-[0.98]"
          >
            {isExternal ? (
              <>
                <ExternalLink className="h-4 w-4 shrink-0" />
                Visit Source
                <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-0 group-hover/cta:opacity-100 group-hover/cta:translate-x-0.5 transition-all duration-150" />
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 shrink-0" />
                Read Article
                <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover/cta:opacity-100 group-hover/cta:translate-x-0.5 transition-all duration-150" />
              </>
            )}
          </a>
        </div>
      </article>
    </RevealCard>
  )
}

// ── Main client component ───────────────────────────────────────────────────
export default function NewsClient({ articles }: { articles: Article[] }) {
  const featured = articles.find((a) => a.featured)
  const nonFeatured = articles.filter((a) => !a.featured)

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All')
  const [search, setSearch] = useState('')
  const [gridKey, setGridKey] = useState(0)

  const categoryValue = (c: CategoryFilter): string =>
    c === 'Study Tips' ? 'study-tips' : c.toLowerCase()

  const filtered = nonFeatured.filter((article) => {
    const matchCategory =
      activeCategory === 'All' || article.category === categoryValue(activeCategory)
    const q = search.toLowerCase().trim()
    const matchSearch =
      !q ||
      article.title.toLowerCase().includes(q) ||
      article.excerpt.toLowerCase().includes(q) ||
      article.tags.some((t) => t.toLowerCase().includes(q))
    return matchCategory && matchSearch
  })

  const handleCategory = (c: CategoryFilter) => {
    setActiveCategory(c)
    setGridKey((k) => k + 1)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
      {/* ── Featured banner ── */}
      {featured && <FeaturedBanner article={featured} />}

      {/* ── Search bar ── */}
      <div className="mb-6 animate-page-enter" style={{ animationDelay: '440ms' }}>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-md-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles, topics or tags…"
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

      {/* ── Category filter chips ── */}
      <div className="mb-8 -mx-4 sm:mx-0 animate-page-enter" style={{ animationDelay: '520ms' }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 sm:px-0 sm:flex-wrap">
          {categories.map((c, i) => {
            const isActive = activeCategory === c
            return (
              <button
                key={c}
                onClick={() => handleCategory(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200 motion-safe:active:scale-95 animate-page-enter ${
                  isActive
                    ? (categoryChipActive[c] ?? 'bg-md-primary text-md-on-primary border-md-primary') + ' shadow-sm'
                    : 'bg-md-surface-container text-md-on-surface-variant border-md-outline/20 hover:bg-md-primary/10 hover:text-md-primary hover:border-md-primary/30'
                }`}
                style={{ animationDelay: `${520 + i * 45}ms` }}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Results count ── */}
      <p className="mb-6 text-sm text-md-on-surface-variant animate-page-enter" style={{ animationDelay: '680ms' }}>
        {filtered.length === 0
          ? 'No articles found'
          : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}`}
        {activeCategory !== 'All' && ` · ${activeCategory}`}
        {search.trim() && ` · matching "${search.trim()}"`}
      </p>

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center animate-page-enter">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-md-primary/10">
            <BookOpen className="h-9 w-9 text-md-primary/50" />
          </div>
          <p className="text-md-on-surface text-lg font-semibold mb-1">No articles found</p>
          <p className="text-md-on-surface-variant/60 text-sm">
            Try a different category or clear the search
          </p>
          <button
            onClick={() => { setSearch(''); handleCategory('All') }}
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
          {filtered.map((article, i) => (
            <ArticleCard key={article.slug} article={article} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
