'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type NearbyCollege = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  nirfRank: number | null
  distance: number
}

function formatLocation(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(', ') || 'Location unavailable'
}

export function NearbyCollegesPanel() {
  const [colleges, setColleges] = useState<NearbyCollege[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.')
      return
    }

    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `/api/colleges/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=50&limit=6`
          )

          const payload = await response.json()

          if (!response.ok) {
            throw new Error(payload.error || 'Unable to load nearby colleges')
          }

          setColleges(payload.data ?? [])
        } catch (requestError: unknown) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load nearby colleges')
        } finally {
          setLoading(false)
        }
      },
      (geoError) => {
        setLoading(false)

        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError('Location access was denied. Please allow it and try again.')
          return
        }

        setError('Unable to determine your current location.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }

  return (
    <Card elevation="elevated" className="overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-md-surface-container-low border-b border-md-outline/10">
        <div>
          <CardTitle className="text-xl">Find Colleges Near You</CardTitle>
          <p className="mt-1 flex text-sm text-md-on-surface-variant">
            Use your current location to see approved colleges within 50 km.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleFindNearby}
          disabled={loading}
          variant="tonal"
        >
          {loading ? 'Searching...' : 'Use My Location'}
        </Button>
      </CardHeader>

      <CardContent className="pt-6">
        {error ? (
          <div className="mb-4 rounded-xl bg-md-error/10 px-4 py-3 text-sm text-md-error">
            {error}
          </div>
        ) : null}

        {colleges.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {colleges.map((college) => (
              <Card
                key={college.id}
                interactive
                className="overflow-hidden"
              >
                <Link
                  href={`/colleges/${college.slug}`}
                  className="block p-4 h-full"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-md-on-surface line-clamp-1" title={college.name}>
                        {college.name}
                      </h3>
                      <p className="mt-1 text-sm text-md-on-surface-variant line-clamp-1">
                        {formatLocation(college.city, college.state)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-md-primary/10 px-2.5 py-1 text-xs font-medium text-md-primary">
                      {(college.distance / 1000).toFixed(1)} km
                    </span>
                  </div>

                  {college.nirfRank ? (
                    <p className="mt-3 text-xs font-medium text-md-secondary">
                      NIRF Rank #{college.nirfRank}
                    </p>
                  ) : null}
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          !loading && !error && (
            <div className="text-center py-6 text-md-on-surface-variant text-sm">
              Click the button above to discover nearby colleges.
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}
