import Link from 'next/link'
import { Award, Search, GitCompare } from 'lucide-react'

const rankingTags = ['Collegedunia', 'IndiaToday', 'IIRF', 'NIRF']

const popularSearches = [
  'Best MBA Colleges in India',
  'Best BTech Colleges in Delhi',
  'Top Government Medical Colleges',
]

const comparisons = [
  { a: 'IIT Delhi', b: 'IIT Bombay' },
  { a: 'IIM Ahmedabad', b: 'IIM Bangalore' },
  { a: 'AIIMS Delhi', b: 'JIPMER Pondicherry' },
]

export default function ExploreProgramsSection() {
  return (
    <section className="bg-md-surface-container py-16">
      <div className="mx-auto max-w-7xl px-4">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-medium text-md-on-surface">Explore Programs</h2>
          <p className="mt-3 text-md-on-surface-variant max-w-md mx-auto">
            Rank, discover, and compare colleges — all the tools you need in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* — Ranking Card — */}
          <div className="group rounded-3xl bg-md-surface p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] flex flex-col">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-md-primary/10 text-md-primary group-hover:bg-md-primary group-hover:text-md-on-primary transition-all duration-300">
              <Award className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-medium text-md-on-surface mb-2">Ranking</h3>
            <p className="text-sm text-md-on-surface-variant mb-5 leading-relaxed flex-1">
              College rankings based on real data — placements, research, faculty, and infrastructure.
            </p>
            <div className="flex flex-wrap gap-2 mb-7">
              {rankingTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-md-outline/20 px-3 py-1 text-xs font-medium text-md-on-surface-variant group-hover:border-md-primary/20 group-hover:text-md-primary transition-colors duration-200"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href="/colleges"
              className="inline-flex rounded-full bg-md-primary px-5 py-2.5 text-sm font-medium text-md-on-primary hover:bg-md-primary/90 transition-all duration-200 active:scale-95 self-start"
            >
              Top Ranked Colleges in India →
            </Link>
          </div>

          {/* — Find Colleges Card — */}
          <div className="group rounded-3xl bg-md-surface p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] flex flex-col">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-md-secondary-container text-md-primary group-hover:bg-md-primary group-hover:text-md-on-primary transition-all duration-300">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-medium text-md-on-surface mb-2">Find Colleges</h3>
            <p className="text-sm text-md-on-surface-variant mb-5 leading-relaxed flex-1">
              Discover colleges by preferences — location, fees, course, cutoff, and more.
            </p>
            <div className="space-y-2 mb-7">
              {popularSearches.map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-2.5 text-sm text-md-on-surface-variant hover:text-md-primary cursor-pointer transition-colors duration-200 group/item"
                >
                  <Search className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover/item:opacity-100" />
                  {s}
                </div>
              ))}
            </div>
            <Link
              href="/colleges"
              className="inline-flex rounded-full bg-md-primary px-5 py-2.5 text-sm font-medium text-md-on-primary hover:bg-md-primary/90 transition-all duration-200 active:scale-95 self-start"
            >
              Discover Top Colleges →
            </Link>
          </div>

          {/* — Compare Colleges Card — */}
          <div className="group rounded-3xl bg-md-surface p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] flex flex-col">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-md-tertiary/10 text-md-tertiary group-hover:bg-md-tertiary group-hover:text-white transition-all duration-300">
              <GitCompare className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-medium text-md-on-surface mb-2">Compare Colleges</h3>
            <p className="text-sm text-md-on-surface-variant mb-5 leading-relaxed flex-1">
              Side-by-side comparison of rank, fees, placements, courses, and facilities.
            </p>
            <div className="space-y-2.5 mb-7">
              {comparisons.map((pair) => (
                <div key={pair.a} className="flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-md-surface-container px-3 py-1 text-xs font-medium text-md-on-surface">
                    {pair.a}
                  </span>
                  <span className="text-md-on-surface-variant text-xs font-medium">vs</span>
                  <span className="rounded-full bg-md-surface-container px-3 py-1 text-xs font-medium text-md-on-surface">
                    {pair.b}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/compare"
              className="inline-flex rounded-full bg-md-primary px-5 py-2.5 text-sm font-medium text-md-on-primary hover:bg-md-primary/90 transition-all duration-200 active:scale-95 self-start"
            >
              Compare Colleges →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
