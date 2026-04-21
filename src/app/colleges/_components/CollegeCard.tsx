import { MapPin } from 'lucide-react'
import { DiscoveryCollegeLink } from '@/components/DiscoveryCollegeLink'
import { ShortlistButton } from '@/components/ShortlistButton'
import { CompareToggleButton } from '@/components/compare/CompareToggleButton'
import { buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type College = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  logoUrl: string | null
  nirfRank: number | null
  category: string | null
  collegeType: string | null
  type: string | null
  minAnnualFee: string | null
}

type CollegeCardProps = {
  college: College
  discoveryScore: number
  isShortlisted: boolean
}

function formatLocation(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(', ') || 'Location unavailable'
}

function titleize(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((v) => v[0].toUpperCase() + v.slice(1))
    .join(' ')
}

export function CollegeCard({ college, discoveryScore, isShortlisted }: CollegeCardProps) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-md-surface-container shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
      {/* Logo block */}
      <div className="relative flex h-32 items-center justify-center bg-md-surface-container-low px-6">
        {college.logoUrl ? (
          <img
            src={college.logoUrl}
            alt={college.name}
            loading="lazy"
            className="max-h-16 max-w-[160px] object-contain"
          />
        ) : (
          <span className="line-clamp-2 text-center text-sm text-md-on-surface-variant">
            {college.name}
          </span>
        )}
        {college.category && (
          <span className="absolute right-3 top-3 rounded-full bg-md-secondary-container px-2 py-0.5 text-[10px] font-medium text-md-on-secondary-container">
            {titleize(college.category)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-2 text-lg font-medium leading-snug text-md-on-surface">
            {college.name}
          </h3>
          <div className="mt-1 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-md-on-surface-variant" />
            <span className="text-sm text-md-on-surface-variant">
              {formatLocation(college.city, college.state)}
            </span>
          </div>
        </div>

        {/* Pill row */}
        <div className="flex flex-wrap gap-1.5">
          {college.nirfRank != null && (
            <span className="rounded-full bg-md-primary/10 px-3 py-1 text-xs text-md-primary">
              NIRF #{college.nirfRank}
            </span>
          )}
          {college.collegeType && (
            <span className="rounded-full bg-md-secondary-container px-3 py-1 text-xs text-md-on-secondary-container">
              {titleize(college.collegeType)}
            </span>
          )}
          {college.type && (
            <span className="rounded-full bg-md-tertiary/10 px-3 py-1 text-xs text-md-tertiary">
              {college.type}
            </span>
          )}
        </div>

        {/* Fee */}
        {college.minAnnualFee && (
          <p className="text-sm font-medium text-md-on-surface">
            From ₹{Number(college.minAnnualFee).toLocaleString('en-IN')} / yr
          </p>
        )}

        {/* Discovery score bar — pushed to bottom of body */}
        <div className="mt-auto">
          <div className="mb-1 flex justify-between text-xs text-md-on-surface-variant">
            <span>Match Score</span>
            <span>{discoveryScore}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={discoveryScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Match score: ${discoveryScore}%`}
            className="h-1.5 rounded-full bg-md-surface-container-low"
          >
            <div
              className="h-full rounded-full bg-md-primary"
              style={{ width: `${discoveryScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 border-t border-md-outline/10 px-5 py-4">
        <ShortlistButton
          collegeId={college.id}
          initialIsShortlisted={isShortlisted}
          className="h-9 flex-1 px-3 text-xs"
        />
        <CompareToggleButton
          college={{ id: college.id, name: college.name, slug: college.slug }}
          className="flex-1 [&_button]:h-9 [&_button]:w-full [&_button]:px-3 [&_button]:text-xs"
        />
        <DiscoveryCollegeLink
          href={`/colleges/${college.slug}`}
          collegeId={college.id}
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'flex-1')}
        >
          View Profile
        </DiscoveryCollegeLink>
      </div>
    </div>
  )
}
