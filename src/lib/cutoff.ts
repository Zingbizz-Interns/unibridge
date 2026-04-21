export type CutoffCollege = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  type: string | null
  nirfRank: number | null
  engineeringCutoff: number | null
  medicalCutoff: number | null
}

export type CutoffScores = {
  engineering: number
  medical: number
}

export type EligibleStream = 'engineering' | 'medical'

export type CollegeSuggestion = {
  college: CutoffCollege
  eligibleStreams: EligibleStream[]
  margin: number
}

export function roundToTwo(value: number) {
  return Math.round(value * 100) / 100
}

export function calculateCutoffScores(input: {
  mathematics: number
  physics: number
  chemistry: number
  biology: number
}): CutoffScores {
  return {
    engineering: roundToTwo(
      input.mathematics + input.physics / 2 + input.chemistry / 2
    ),
    medical: roundToTwo(
      input.physics / 2 + input.chemistry / 2 + input.biology
    ),
  }
}

export function suggestEligibleColleges(
  colleges: CutoffCollege[],
  cutoffScores: CutoffScores
) {
  const suggestions: CollegeSuggestion[] = []

  for (const college of colleges) {
    const eligibleStreams: EligibleStream[] = []
    const margins: number[] = []

    if (
      college.engineeringCutoff !== null
      && cutoffScores.engineering >= college.engineeringCutoff
    ) {
      eligibleStreams.push('engineering')
      margins.push(cutoffScores.engineering - college.engineeringCutoff)
    }

    if (
      college.medicalCutoff !== null
      && cutoffScores.medical >= college.medicalCutoff
    ) {
      eligibleStreams.push('medical')
      margins.push(cutoffScores.medical - college.medicalCutoff)
    }

    if (eligibleStreams.length > 0) {
      suggestions.push({
        college,
        eligibleStreams,
        margin: margins.length > 0 ? Math.max(...margins) : 0,
      })
    }
  }

  return suggestions.sort((a, b) => {
    if (a.college.nirfRank !== null && b.college.nirfRank !== null) {
      if (a.college.nirfRank !== b.college.nirfRank) {
        return a.college.nirfRank - b.college.nirfRank
      }
    } else if (a.college.nirfRank !== null) {
      return -1
    } else if (b.college.nirfRank !== null) {
      return 1
    }

    if (a.margin !== b.margin) {
      return b.margin - a.margin
    }

    return a.college.name.localeCompare(b.college.name)
  })
}

export function formatLocation(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(', ') || 'Location unavailable'
}
