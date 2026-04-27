import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, ExternalLink, ArrowRight, BookOpen } from 'lucide-react'
import { articles } from '../data'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return articles
    .filter((a) => !a.externalUrl)
    .map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = articles.find((a) => a.slug === slug)
  if (!article) return {}
  return {
    title: `${article.title} | UniBridge`,
    description: article.excerpt,
  }
}

const categoryLabel: Record<string, string> = {
  admissions:   'Admissions',
  policy:       'Policy',
  rankings:     'Rankings',
  scholarships: 'Scholarships',
  career:       'Career',
  'study-tips': 'Study Tips',
}

const categoryBadge: Record<string, string> = {
  admissions:   'bg-blue-50   text-blue-700   border-blue-200',
  policy:       'bg-violet-50 text-violet-700 border-violet-200',
  rankings:     'bg-amber-50  text-amber-700  border-amber-200',
  scholarships: 'bg-green-50  text-green-700  border-green-200',
  career:       'bg-orange-50 text-orange-700 border-orange-200',
  'study-tips': 'bg-rose-50   text-rose-700   border-rose-200',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = articles.find((a) => a.slug === slug)

  if (!article || article.externalUrl) notFound()

  const related = articles
    .filter((a) => a.slug !== slug && a.category === article.category && !a.externalUrl)
    .slice(0, 3)

  const badge = categoryBadge[article.category] ?? 'bg-md-surface-container text-md-on-surface-variant border-md-outline/20'

  return (
    <main className="min-h-screen bg-md-surface">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">

        {/* ── Back link ── */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-md-on-surface-variant hover:text-md-primary transition-colors duration-150 mb-8 group animate-page-enter"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Back to News &amp; Articles
        </Link>

        {/* ── Article header ── */}
        <article className="animate-page-enter" style={{ animationDelay: '80ms' }}>
          {/* Category badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge}`}>
              {categoryLabel[article.category]}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-md-on-surface leading-snug mb-4">
            {article.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-md-on-surface-variant/60 mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {article.readTime}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-md-surface-container px-3 py-1 text-xs text-md-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-md-outline/10 mb-8" />

          {/* Excerpt lead */}
          <p className="text-lg text-md-on-surface-variant leading-relaxed mb-8 font-medium">
            {article.excerpt}
          </p>

          {/* Body paragraphs */}
          <div className="space-y-5">
            {article.content?.map((para, i) => (
              <p key={i} className="text-base text-md-on-surface leading-[1.8]">
                {para}
              </p>
            ))}
          </div>
        </article>

        {/* ── Related articles ── */}
        {related.length > 0 && (
          <section
            className="mt-16 animate-page-enter"
            style={{ animationDelay: '200ms' }}
          >
            <h2 className="text-lg font-bold text-md-on-surface mb-5">
              More in {categoryLabel[article.category]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/news/${rel.slug}`}
                  className="group flex flex-col rounded-[20px] bg-md-surface-container hover:bg-md-surface border border-md-outline/10 hover:shadow-md p-4 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span className={`inline-flex items-center self-start rounded-full border px-2 py-0.5 text-xs font-medium mb-2 ${categoryBadge[rel.category]}`}>
                    {categoryLabel[rel.category]}
                  </span>
                  <p className="text-sm font-semibold text-md-on-surface group-hover:text-md-primary transition-colors duration-150 line-clamp-3 leading-snug mb-2 flex-1">
                    {rel.title}
                  </p>
                  <span className="flex items-center gap-1 text-xs text-md-primary mt-auto">
                    Read
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-150" />
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/news"
                className="inline-flex items-center gap-2 rounded-full bg-md-primary/10 px-6 py-2.5 text-sm font-medium text-md-primary hover:bg-md-primary/15 transition-colors active:scale-95"
              >
                <BookOpen className="h-4 w-4" />
                Browse all articles
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
