import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  submitted: 'bg-sky-100 text-sky-800',
  under_review: 'bg-amber-100 text-amber-800',
  shortlisted: 'bg-violet-100 text-violet-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  withdrawn: 'bg-slate-200 text-slate-700',
}

export function formatApplicationStatus(status: string | null | undefined) {
  if (!status) {
    return 'Unknown'
  }

  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function ApplicationStatusBadge({
  status,
  className,
}: {
  status: string | null | undefined
  className?: string
}) {
  const resolvedStatus = status || 'submitted'

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
        statusStyles[resolvedStatus] || 'bg-slate-100 text-slate-700',
        className
      )}
    >
      {formatApplicationStatus(resolvedStatus)}
    </span>
  )
}
