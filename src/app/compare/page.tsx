import type { Metadata } from 'next'
import Link from 'next/link'
import CompareSelectionSync from '@/components/compare/CompareSelectionSync'
import ShareCompareButton from '@/components/compare/ShareCompareButton'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { getComparedColleges, parseCompareIds, type ComparedCollege } from '@/lib/college-compare'

type ComparePageState =
  | { kind: 'empty'; message: string }
  | { kind: 'invalid'; message: string }
  | { kind: 'ready'; colleges: ComparedCollege[] }

function formatCurrency(value: number | null) {
  if (value === null) {
    return 'N/A'
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatLocation(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(', ') || 'Location unavailable'
}

function getBestNumericValue(values: Array<number | null>, direction: 'min' | 'max') {
  const comparableValues = values.filter((value): value is number => value !== null)

  if (comparableValues.length < 2) {
    return null
  }

  return direction === 'min'
    ? Math.min(...comparableValues)
    : Math.max(...comparableValues)
}

function getValueClass(value: number | null, bestValue: number | null) {
  return value !== null && bestValue !== null && value === bestValue
    ? 'bg-emerald-100 text-emerald-900 font-semibold'
    : ''
}

function getComparisonRows(colleges: ComparedCollege[]) {
  const bestNirfRank = getBestNumericValue(colleges.map((college) => college.nirfRank), 'min')
  const bestBtechFee = getBestNumericValue(colleges.map((college) => college.annualFees.btech), 'min')
  const bestMbaFee = getBestNumericValue(colleges.map((college) => college.annualFees.mba), 'min')
  const bestAvgPackage = getBestNumericValue(colleges.map((college) => college.placements.avgPackage), 'max')
  const bestPlacementPercent = getBestNumericValue(colleges.map((college) => college.placements.placementPercent), 'max')

  return [
    {
      label: 'Logo & Name',
      render: (college: ComparedCollege) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-md-secondary-container text-lg font-semibold text-md-on-secondary-container"
            style={college.logoUrl ? {
              backgroundImage: `url(${college.logoUrl})`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              backgroundColor: 'transparent',
              border: '1px solid rgba(0,0,0,0.08)',
            } : undefined}
            aria-hidden="true"
          >
            {college.logoUrl ? '' : college.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-md-on-surface">{college.name}</p>
            <p className="text-sm text-md-on-surface-variant">{college.type || 'College'}</p>
          </div>
        </div>
      ),
    },
    {
      label: 'City / State',
      render: (college: ComparedCollege) => formatLocation(college.city, college.state),
    },
    {
      label: 'NIRF Rank',
      render: (college: ComparedCollege) => college.nirfRank ? `#${college.nirfRank}` : 'N/A',
      className: (college: ComparedCollege) => getValueClass(college.nirfRank, bestNirfRank),
    },
    {
      label: 'NAAC Grade',
      render: (college: ComparedCollege) => college.naacGrade || 'N/A',
    },
    {
      label: 'Type / Affiliation',
      render: (college: ComparedCollege) => [college.type, college.affiliation].filter(Boolean).join(' / ') || 'N/A',
    },
    {
      label: 'Available Courses',
      render: (college: ComparedCollege) =>
        college.availableCourses.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {college.availableCourses.map((course) => (
              <li key={course}>{course}</li>
            ))}
          </ul>
        ) : 'N/A',
    },
    {
      label: 'B.Tech Annual Fee',
      render: (college: ComparedCollege) => formatCurrency(college.annualFees.btech),
      className: (college: ComparedCollege) => getValueClass(college.annualFees.btech, bestBtechFee),
    },
    {
      label: 'MBA Annual Fee',
      render: (college: ComparedCollege) => formatCurrency(college.annualFees.mba),
      className: (college: ComparedCollege) => getValueClass(college.annualFees.mba, bestMbaFee),
    },
    {
      label: 'Avg Package',
      render: (college: ComparedCollege) => formatCurrency(college.placements.avgPackage),
      className: (college: ComparedCollege) => getValueClass(college.placements.avgPackage, bestAvgPackage),
    },
    {
      label: 'Placement %',
      render: (college: ComparedCollege) =>
        college.placements.placementPercent !== null
          ? `${college.placements.placementPercent}%`
          : 'N/A',
      className: (college: ComparedCollege) => getValueClass(college.placements.placementPercent, bestPlacementPercent),
    },
    {
      label: 'Actions',
      render: (college: ComparedCollege) => (
        <div className="flex flex-col gap-2">
          <Button asChild size="sm">
            <Link href={`/apply/${college.id}`}>Apply</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/colleges/${college.slug}`}>View College</Link>
          </Button>
        </div>
      ),
    },
  ]
}

async function resolveComparePageState(
  searchParams: Promise<{ ids?: string }>
): Promise<ComparePageState> {
  const resolvedSearchParams = await searchParams

  if (!resolvedSearchParams.ids) {
    return {
      kind: 'empty',
      message: 'Pick at least two approved colleges from the discovery pages to unlock the comparison view.',
    }
  }

  let ids: string[]
  try {
    ids = parseCompareIds(resolvedSearchParams.ids, { min: 2, max: 3 })
  } catch (error) {
    return {
      kind: 'invalid',
      message: error instanceof Error ? error.message : 'Please choose 2 to 3 colleges to compare.',
    }
  }

  const colleges = await getComparedColleges(ids)

  if (!colleges || colleges.length < 2) {
    return {
      kind: 'invalid',
      message: 'One or more colleges in this comparison link are unavailable or not approved.',
    }
  }

  return {
    kind: 'ready',
    colleges,
  }
}

function CompareEmptyState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/colleges">Browse Colleges</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}): Promise<Metadata> {
  const state = await resolveComparePageState(searchParams)

  if (state.kind !== 'ready') {
    return {
      title: 'Compare Colleges | UniBridge',
      description: 'Compare colleges side by side on UniBridge.',
    }
  }

  const names = state.colleges.map((college) => college.name).join(' vs ')

  return {
    title: `Compare ${names} | UniBridge`,
    description: `Side-by-side comparison for ${names} on UniBridge.`,
    openGraph: {
      title: `Compare ${names} | UniBridge`,
      description: `Side-by-side comparison for ${names} on UniBridge.`,
    },
  }
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const state = await resolveComparePageState(searchParams)

  if (state.kind === 'empty') {
    return (
      <CompareEmptyState
        title="Select colleges to compare"
        message={state.message}
      />
    )
  }

  if (state.kind === 'invalid') {
    return (
      <CompareEmptyState
        title="Invalid comparison link"
        message={state.message}
      />
    )
  }

  const compareItems = state.colleges.map((college) => ({
    id: college.id,
    name: college.name,
    slug: college.slug,
  }))
  const rows = getComparisonRows(state.colleges)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 animate-page-enter">
      <CompareSelectionSync items={compareItems} />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-md-primary">
            Compare Colleges
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-md-on-surface">
            Side-by-side view for smarter decisions
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-md-on-surface-variant">
            Fees, rankings, placements, and course mix are all aligned here so students can judge trade-offs quickly.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ShareCompareButton />
          <Button asChild variant="outline">
            <Link href="/colleges">Back to Colleges</Link>
          </Button>
        </div>
      </div>

      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Comparison Table</CardTitle>
          <CardDescription>
            Best numeric values are highlighted for quick scanning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[880px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-md-surface-container px-4 py-4 text-left text-sm font-medium text-md-on-surface-variant">
                    Attribute
                  </th>
                  {state.colleges.map((college) => (
                    <th
                      key={college.id}
                      className="border-l border-md-outline/10 bg-md-surface px-4 py-4 text-left text-sm font-medium text-md-on-surface-variant"
                    >
                      {college.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th className="sticky left-0 z-10 border-t border-md-outline/10 bg-md-surface-container px-4 py-4 text-left align-top text-sm font-medium text-md-on-surface">
                      {row.label}
                    </th>
                    {state.colleges.map((college) => (
                      <td
                        key={`${row.label}-${college.id}`}
                        className={`border-l border-t border-md-outline/10 px-4 py-4 align-top text-sm text-md-on-surface ${row.className?.(college) || ''}`}
                      >
                        {row.render(college)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
