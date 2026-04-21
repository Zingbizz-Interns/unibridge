'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BadgeCheck, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  calculateCutoffScores,
  formatLocation,
  type CollegeSuggestion,
  type CutoffCollege,
  type CutoffScores,
  suggestEligibleColleges,
} from '@/lib/cutoff'
import { cn } from '@/lib/utils'

type CutoffCalculatorProps = {
  colleges: CutoffCollege[]
  className?: string
}

type MarksInputState = {
  mathematics: string
  physics: string
  chemistry: string
  biology: string
}

type MarksPayload = {
  mathematics: number
  physics: number
  chemistry: number
  biology: number
}

type ParseMarksResult =
  | { ok: false; error: string }
  | { ok: true; data: MarksPayload }

const initialMarks: MarksInputState = {
  mathematics: '',
  physics: '',
  chemistry: '',
  biology: '',
}

function toTwoDecimals(value: number) {
  return value.toFixed(2)
}

function parseMarks(payload: MarksInputState): ParseMarksResult {
  const parsed: Partial<MarksPayload> = {}
  const fields = Object.entries(payload) as Array<[keyof MarksPayload, string]>

  for (const [field, rawValue] of fields) {
    const value = rawValue.trim()
    if (!value) {
      return { ok: false, error: 'Enter all four marks to calculate your cut-off.' }
    }

    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) {
      return { ok: false, error: 'All marks must be valid numbers.' }
    }

    if (numericValue < 0 || numericValue > 100) {
      return { ok: false, error: 'Each mark must be between 0 and 100.' }
    }

    parsed[field] = numericValue
  }

  return { ok: true, data: parsed as MarksPayload }
}

export function CutoffCalculator({ colleges, className }: CutoffCalculatorProps) {
  const [marks, setMarks] = useState<MarksInputState>(initialMarks)
  const [error, setError] = useState('')
  const [scores, setScores] = useState<CutoffScores | null>(null)
  const [suggestions, setSuggestions] = useState<CollegeSuggestion[]>([])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const parsed = parseMarks(marks)
    if (!parsed.ok) {
      setScores(null)
      setSuggestions([])
      setError(parsed.error)
      return
    }

    const calculatedScores = calculateCutoffScores(parsed.data)
    const eligibleColleges = suggestEligibleColleges(colleges, calculatedScores).slice(0, 8)

    setScores(calculatedScores)
    setSuggestions(eligibleColleges)
  }

  return (
    <section className={cn('w-full', className)}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-md-secondary-container px-5 py-2 text-sm font-medium text-md-primary">
            <Calculator className="h-4 w-4" aria-hidden="true" />
            Calculate Your Potential
          </span>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-md-on-surface sm:text-5xl">
            Cut-off <span className="text-md-primary">Calculator</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-md-on-surface-variant">
            Enter your marks to calculate your engineering and medical cut-off scores.
          </p>
        </div>

        <Card elevation="elevated" className="overflow-hidden border border-md-outline/10">
          <div className="bg-gradient-to-r from-md-secondary-container/50 to-md-surface-container-low px-6 py-8 md:px-9">
            <h3 className="text-3xl font-semibold text-md-on-surface">Enter Your Marks</h3>
            <p className="mt-2 text-base text-md-on-surface-variant">All marks should be out of 100.</p>
          </div>

          <CardContent className="p-6 md:p-9">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="cutoff-math" className="mb-2 block text-sm font-medium text-md-on-surface">
                    Mathematics Mark
                  </label>
                  <Input
                    id="cutoff-math"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={marks.mathematics}
                    onChange={(event) => setMarks((current) => ({ ...current, mathematics: event.target.value }))}
                    placeholder="Enter your Mathematics mark"
                  />
                </div>

                <div>
                  <label htmlFor="cutoff-physics" className="mb-2 block text-sm font-medium text-md-on-surface">
                    Physics Mark
                  </label>
                  <Input
                    id="cutoff-physics"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={marks.physics}
                    onChange={(event) => setMarks((current) => ({ ...current, physics: event.target.value }))}
                    placeholder="Enter your Physics mark"
                  />
                </div>

                <div>
                  <label htmlFor="cutoff-chemistry" className="mb-2 block text-sm font-medium text-md-on-surface">
                    Chemistry Mark
                  </label>
                  <Input
                    id="cutoff-chemistry"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={marks.chemistry}
                    onChange={(event) => setMarks((current) => ({ ...current, chemistry: event.target.value }))}
                    placeholder="Enter your Chemistry mark"
                  />
                </div>

                <div>
                  <label htmlFor="cutoff-biology" className="mb-2 block text-sm font-medium text-md-on-surface">
                    Biology Mark
                  </label>
                  <Input
                    id="cutoff-biology"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={marks.biology}
                    onChange={(event) => setMarks((current) => ({ ...current, biology: event.target.value }))}
                    placeholder="Enter your Biology mark"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="h-14 w-full">
                <Calculator className="mr-2 h-5 w-5" aria-hidden="true" />
                Calculate Cut-off
              </Button>
            </form>
          </CardContent>
        </Card>

        {scores && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="border border-md-outline/10 p-6">
                <p className="text-sm font-medium text-md-on-surface-variant">Engineering Cut-off</p>
                <p className="mt-2 text-4xl font-semibold text-md-on-surface">{toTwoDecimals(scores.engineering)}</p>
                <p className="mt-1 text-sm text-md-on-surface-variant">Formula: Maths + Physics/2 + Chemistry/2</p>
              </Card>

              <Card className="border border-md-outline/10 p-6">
                <p className="text-sm font-medium text-md-on-surface-variant">Medical Cut-off</p>
                <p className="mt-2 text-4xl font-semibold text-md-on-surface">{toTwoDecimals(scores.medical)}</p>
                <p className="mt-1 text-sm text-md-on-surface-variant">Formula: Physics/2 + Chemistry/2 + Biology</p>
              </Card>
            </div>

            <Card className="border border-md-outline/10">
              <CardContent className="p-6 md:p-7">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-md-on-surface">Eligible College Suggestions</h3>
                    <p className="text-sm text-md-on-surface-variant">
                      Showing colleges where your score is at or above their published cut-off.
                    </p>
                  </div>
                  <span className="rounded-full bg-md-secondary-container px-3 py-1 text-xs font-medium text-md-on-secondary-container">
                    {suggestions.length} eligible
                  </span>
                </div>

                {colleges.length === 0 ? (
                  <div className="rounded-2xl bg-md-surface p-5 text-sm text-md-on-surface-variant">
                    No colleges have published cut-off values yet.
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="rounded-2xl bg-md-surface p-5 text-sm text-md-on-surface-variant">
                    No eligible colleges found yet for these marks. Try with updated marks or explore all colleges.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {suggestions.map((suggestion) => (
                      <Card key={suggestion.college.id} className="border border-md-outline/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-base font-semibold text-md-on-surface">{suggestion.college.name}</h4>
                            <p className="mt-1 text-sm text-md-on-surface-variant">
                              {formatLocation(suggestion.college.city, suggestion.college.state)}
                            </p>
                            {suggestion.college.nirfRank !== null && (
                              <p className="mt-1 text-xs font-medium text-md-primary">
                                NIRF #{suggestion.college.nirfRank}
                              </p>
                            )}
                          </div>
                          <BadgeCheck className="mt-1 h-5 w-5 text-md-primary" aria-hidden="true" />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {suggestion.eligibleStreams.includes('engineering')
                            && suggestion.college.engineeringCutoff !== null && (
                              <span className="rounded-full bg-md-secondary-container px-3 py-1 text-xs font-medium text-md-on-secondary-container">
                                Engineering {toTwoDecimals(suggestion.college.engineeringCutoff)}
                              </span>
                            )}
                          {suggestion.eligibleStreams.includes('medical')
                            && suggestion.college.medicalCutoff !== null && (
                              <span className="rounded-full bg-md-primary/10 px-3 py-1 text-xs font-medium text-md-primary">
                                Medical {toTwoDecimals(suggestion.college.medicalCutoff)}
                              </span>
                            )}
                        </div>

                        <p className="mt-3 text-xs text-md-on-surface-variant">
                          You are {toTwoDecimals(suggestion.margin)} points above at least one required cut-off.
                        </p>

                        <Button variant="outline" size="sm" asChild className="mt-4">
                          <Link href={`/colleges/${suggestion.college.slug}`}>View College</Link>
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}
