import { performance } from 'node:perf_hooks'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE_URL = process.env.BENCH_BASE_URL || 'http://127.0.0.1:3000'
const ITERATIONS = Number(process.env.BENCH_ITERATIONS || '20')

const scenarios = [
  '/api/colleges?page=1&limit=20',
  '/api/colleges?page=1&limit=20&category=engineering',
  '/api/colleges?page=1&limit=20&state=Tamil%20Nadu&courseLevel=ug&sort=nirf_asc',
  '/api/colleges?page=1&limit=20&stream=Computer%20Science&feeMax=200000&sort=fee_low',
]

function percentile(values, p) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[index]
}

async function measureScenario(path) {
  const durations = []

  for (let i = 0; i < ITERATIONS; i += 1) {
    const start = performance.now()
    const response = await fetch(`${BASE_URL}${path}`)
    if (!response.ok) {
      throw new Error(`Scenario failed (${path}): ${response.status}`)
    }
    await response.json()
    durations.push(performance.now() - start)
  }

  return {
    path,
    iterations: ITERATIONS,
    p50: Number(percentile(durations, 50).toFixed(2)),
    p95: Number(percentile(durations, 95).toFixed(2)),
    max: Number(Math.max(...durations).toFixed(2)),
  }
}

async function main() {
  console.log(`Running benchmark against ${BASE_URL}`)
  console.log(`Iterations per scenario: ${ITERATIONS}`)

  const results = []
  for (const scenario of scenarios) {
    const result = await measureScenario(scenario)
    results.push(result)
    console.log(JSON.stringify(result))
  }

  const reportDir = join(process.cwd(), 'scripts', 'reports')
  const reportPath = join(reportDir, 'phase14-benchmark-report.json')
  mkdirSync(reportDir, { recursive: true })
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        iterations: ITERATIONS,
        results,
      },
      null,
      2
    )
  )
  console.log(`Benchmark report written to: ${reportPath}`)
}

main().catch((error) => {
  console.error('Benchmark failed:', error)
  process.exit(1)
})
