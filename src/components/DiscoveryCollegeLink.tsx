'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'

type DiscoveryCollegeLinkProps = {
  href: string
  collegeId: string
  className?: string
  children: ReactNode
}

export function DiscoveryCollegeLink({
  href,
  collegeId,
  className,
  children,
}: DiscoveryCollegeLinkProps) {
  const searchParams = useSearchParams()

  const handleClick = () => {
    const meta: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      meta[key] = value
    })

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'open_college_from_filtered_results',
        collegeId,
        meta,
      }),
      keepalive: true,
    }).catch(console.error)
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
