import Link from 'next/link'

type Top10College = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  nirfRank: number | null
  engineeringCutoff: string | null
  medicalCutoff: string | null
  minAnnualFee: string | null
}

type Props = {
  colleges: Top10College[]
  streamName: string
  viewAllHref: string
}

function formatLocation(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(', ') || 'Location unavailable'
}

function formatFee(fee: string | null): string {
  if (!fee) return '—'
  const num = Number(fee)
  if (Number.isNaN(num)) return '—'
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L/yr`
  return `₹${Math.round(num / 1000)}K/yr`
}

function formatCutoff(
  streamName: string,
  engineeringCutoff: string | null,
  medicalCutoff: string | null,
): string {
  const lower = streamName.toLowerCase()
  if (lower === 'engineering' && engineeringCutoff) {
    const num = Number(engineeringCutoff)
    return Number.isNaN(num) ? '—' : num.toFixed(2)
  }
  if (lower === 'medical' && medicalCutoff) {
    const num = Number(medicalCutoff)
    return Number.isNaN(num) ? '—' : num.toFixed(2)
  }
  return '—'
}

export function Top10Table({ colleges, streamName, viewAllHref }: Props) {
  return (
    <div className="animate-slide-up">
      {/* Badge + View All */}
      <div className="mb-5 flex items-center justify-between animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full bg-md-secondary-container px-4 py-1.5">
          <span className="text-sm font-medium text-md-on-secondary-container">
            {streamName} — Top {colleges.length} Colleges
          </span>
        </div>
        <Link
          href={viewAllHref}
          className="text-sm text-md-primary transition-colors duration-200 hover:underline"
        >
          View all {streamName} colleges →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl bg-md-surface-container shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-md-outline/20 bg-md-surface-container-high">
              <th className="w-12 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                College
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                NIRF
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                Cutoff
              </th>
              <th className="w-36 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                Total Fees
              </th>
            </tr>
          </thead>
          <tbody>
            {colleges.map((college, index) => (
              <tr
                key={college.id}
                className="animate-fade-in border-b border-md-outline/10 transition-colors duration-150 hover:bg-md-surface-container-high last:border-0"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-md-primary/10 text-xs font-semibold text-md-primary">
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/colleges/${college.slug}`}
                    className="font-medium text-md-on-surface transition-colors duration-150 hover:text-md-primary"
                  >
                    {college.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-md-on-surface-variant">
                    {formatLocation(college.city, college.state)}
                  </p>
                </td>
                <td className="px-4 py-4 text-md-on-surface-variant">
                  {college.nirfRank ? `#${college.nirfRank}` : '—'}
                </td>
                <td className="px-4 py-4 text-md-on-surface-variant">
                  {formatCutoff(streamName, college.engineeringCutoff, college.medicalCutoff)}
                </td>
                <td className="px-4 py-4 text-md-on-surface-variant">
                  {formatFee(college.minAnnualFee)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
