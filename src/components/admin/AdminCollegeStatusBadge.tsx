import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-rose-100 text-rose-900',
  suspended: 'bg-slate-200 text-slate-800',
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function AdminCollegeStatusBadge({
  status,
  className,
}: {
  status: string | null | undefined
  className?: string
}) {
  const resolvedStatus = status || 'pending'

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
        statusStyles[resolvedStatus] || 'bg-slate-100 text-slate-700',
        className
      )}
    >
      {formatStatus(resolvedStatus)}
    </span>
  )
}

export function formatCollegeStatus(status: string | null | undefined) {
  return formatStatus(status || 'pending')
}
