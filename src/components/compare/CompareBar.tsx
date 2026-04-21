'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { useCompare } from './CompareProvider'

function shouldShowCompareBar(pathname: string) {
  return pathname === '/' || pathname.startsWith('/colleges') || pathname.startsWith('/compare')
}

export default function CompareBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { items, hydrated, removeItem, clearItems } = useCompare()
  const barRef = useRef<HTMLDivElement>(null)
  const showCompareBar = hydrated && items.length > 0 && shouldShowCompareBar(pathname)

  useEffect(() => {
    if (!showCompareBar) {
      document.body.style.removeProperty('--compare-bar-offset')
      return
    }

    const updateOffset = () => {
      const barHeight = barRef.current?.offsetHeight ?? 0
      const offset = barHeight + 32
      document.body.style.setProperty('--compare-bar-offset', `${offset}px`)
    }

    updateOffset()
    window.addEventListener('resize', updateOffset)

    let observer: ResizeObserver | null = null
    if (barRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateOffset)
      observer.observe(barRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateOffset)
      observer?.disconnect()
      document.body.style.removeProperty('--compare-bar-offset')
    }
  }, [showCompareBar, items.length])

  if (!showCompareBar) {
    return null
  }

  const compareHref = `/compare?ids=${items.map((item) => item.id).join(',')}`

  const handleClear = () => {
    clearItems()

    if (pathname.startsWith('/compare')) {
      router.push('/colleges')
      router.refresh()
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 sm:px-6">
      <div ref={barRef} className="mx-auto flex max-w-5xl flex-col gap-4 rounded-3xl border border-md-outline/15 bg-md-surface-container/95 p-4 shadow-xl backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-md-primary">
            Compare Colleges
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 rounded-full bg-md-secondary-container px-3 py-2 text-sm text-md-on-secondary-container"
              >
                <Link href={`/colleges/${item.slug}`} className="max-w-[180px] truncate hover:underline">
                  {item.name}
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium hover:bg-black/15"
                  aria-label={`Remove ${item.name} from compare`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          {items.length >= 2 ? (
            <Button onClick={() => router.push(compareHref)}>
              Compare Now
            </Button>
          ) : (
            <Button disabled>
              Compare Now
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
