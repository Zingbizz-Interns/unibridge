'use client'
import { useRouter } from 'next/navigation'

type Filters = Record<string, string | string[] | undefined>

export function FilterSelect({
  name,
  value,
  options,
  placeholder,
  filters,
}: {
  name: string
  value: string | undefined
  options: { value: string; label: string }[]
  placeholder: string
  filters: Filters
}) {
  const router = useRouter()

  const buildHref = (newValue: string | undefined) => {
    const params = new URLSearchParams()
    params.set('page', '1')
    const merged: Filters = { ...filters, [name]: newValue }
    for (const [key, val] of Object.entries(merged)) {
      if (val === undefined || val === null) continue
      if (Array.isArray(val)) {
        if (val.length) params.set(key, val.join(','))
      } else if (val) {
        params.set(key, val)
      }
    }
    return `/colleges?${params.toString()}`
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => router.push(buildHref(e.target.value || undefined))}
      className="w-full h-10 rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-3 text-sm text-md-on-surface outline-none transition-colors duration-200 focus:border-md-primary cursor-pointer"
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
