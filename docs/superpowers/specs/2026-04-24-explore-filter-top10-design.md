# Explore Page — Filter Fix, Seed Data & Top 10 Table

**Date:** 2026-04-24  
**Status:** Approved  

---

## Problem

The `/colleges` (Explore) page shows 0 results when stream-based goals are selected because:

1. The DB has too few seed colleges per stream (≤5).
2. The stream filter does ILIKE on `courses.stream`, but most engineering colleges store courses as "Computer Science" / "Mechanical", not "Engineering" — so `?stream=Engineering` matches almost nothing.
3. The home-page goal cards use inconsistent routing (`?category=engineering` for some goals, `?stream=Management` for others).
4. No Top 10 ranking table exists.

---

## Scope

Three coordinated changes, all within `/colleges` (no new routes):

1. Fix the filtering logic in `src/app/colleges/page.tsx`
2. Expand seed data in `src/scripts/seed-demo-colleges.ts`
3. Add a Top 10 Table that replaces the card grid when a stream is active

Plus: update home-page goal routing in `src/components/home/StudyGoalSection.tsx`.

---

## Section 1 — Filtering Logic

### Stream → Category mapping

Add a constant in `page.tsx`:

```ts
const STREAM_CATEGORY_MAP: Record<string, typeof categoryEnum.enumValues[number]> = {
  engineering:      'engineering',
  medical:          'medical',
  'arts & science': 'arts_science',
  'arts and science': 'arts_science',
  arts_science:     'arts_science',
}
```

When processing the `stream` URL param, normalize each value to lowercase and look it up:

- **Mapped streams** (Engineering, Medical, Arts & Science): inject `eq(colleges.category, mappedValue)` into `baseConditions` directly. Do NOT run the ILIKE course subquery for these streams.
- **Unmapped streams** (Management, Commerce, Law, etc.): keep the existing ILIKE `courses.stream` subquery.

This resolves the "0 results for Engineering" root cause without a schema change.

### Multi-filter AND behaviour

No change — all active filters remain AND-combined (stream + state + city + fee all apply together).

### Normalization

Stream input is already case-insensitive via ILIKE. The category map uses lowercase keys, so normalize the stream value before lookup:

```ts
const streamLower = s.toLowerCase()
const mappedCategory = STREAM_CATEGORY_MAP[streamLower]
```

### Home-page goal routing

Update all six goal cards in `StudyGoalSection.tsx` to use `?stream=<GoalName>`:

| Goal | New href |
|---|---|
| Engineering | `/colleges?stream=Engineering` |
| Management | `/colleges?stream=Management` |
| Commerce | `/colleges?stream=Commerce` |
| Arts | `/colleges?stream=Arts+%26+Science` |
| Medical | `/colleges?stream=Medical` |
| Law | `/colleges?stream=Law` |

Also update the three quick-filter chips in the hero section of `page.tsx` from `?category=engineering` etc. to `?stream=Engineering` etc.

---

## Section 2 — Seed Data

File: `src/scripts/seed-demo-colleges.ts`

Expand `demoColleges` array. Target counts:

| Stream | category value | College count |
|---|---|---|
| Engineering | `engineering` | 15 |
| Medical | `medical` | 15 |
| Arts & Science | `arts_science` | 10 |
| Management | `arts_science` | 10 |
| Commerce | `arts_science` | 8 |
| Law | `arts_science` | 8 |

**Per-college requirements:**
- Realistic Indian institution names (IITs, NITs, AIIMS, IIMs, NLUs as naming references)
- Diverse cities and states across India
- Realistic `nirfRank` (1–300 range, some null for unranked)
- `engineeringCutoff` set for engineering colleges, `medicalCutoff` for medical
- 2–4 courses per college
- For Management/Commerce/Law colleges: courses must have `stream` exactly matching the goal name (e.g., `stream: 'Management'`) so the ILIKE filter resolves correctly
- `verificationStatus: 'approved'` on all
- `annualFee` values realistic (engineering ₹50k–₹3L, medical ₹50k–₹10L, management ₹2L–₹20L)

Seed remains idempotent (skip-if-slug-exists).

---

## Section 3 — Top 10 Table

### Trigger

Render the Top 10 Table (instead of the card grid) when `streams.length > 0`.

### Data

No extra DB query. Use the same `rows` result from the existing main query, but:
- Order by `nirfRank ASC NULLS LAST` when a stream is active (override the default sort)
- Limit to 10 rows

### UI Structure

```
[Stream Badge: "Engineering — Top 10 Colleges"]   [View all Engineering colleges →]

┌─────────────────────────────────────────────────────────────────────────────┐
│ Rank │ College                          │ NIRF  │ Cutoff │ Total Fees       │
├──────┼──────────────────────────────────┼───────┼────────┼──────────────────┤
│  1   │ IIT Bombay                       │  #3   │ 99.5   │ ₹2,20,000/yr     │
│      │ Mumbai, Maharashtra              │       │        │                  │
│  2   │ NIT Trichy                       │  #10  │ 97.2   │ ₹1,40,000/yr     │
│      │ Tiruchirappalli, Tamil Nadu      │       │        │                  │
│ ...  │ ...                              │  ...  │  ...   │ ...              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Columns:**

| Column | Source | Fallback |
|---|---|---|
| Rank | Row index 1–10 | — |
| College Name | `colleges.name` | — |
| Location | `city, state` | "Location unavailable" |
| NIRF Ranking | `colleges.nirfRank` formatted as `#N` | `—` |
| Cutoff | `engineeringCutoff` for engineering stream, `medicalCutoff` for medical, `—` for others | `—` |
| Total Fees | `minAnnualFee` formatted as `₹X/yr` | `—` |

College Name is a link to `/colleges/[slug]`.

### Animations

Add to `src/app/globals.css`:

```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.animate-fade-in {
  animation: fadeIn 0.35s ease both;
}
```

- Table container: `animate-slide-up`
- Stream badge: `animate-fade-in`
- Each `<tr>`: `animate-fade-in` with inline `style={{ animationDelay: \`${index * 60}ms\` }}` for staggered cascade

### "View all" link

The badge row includes a link: `buildPageHref(1, { ...filters, stream: [] })` — clears the stream filter and returns to the full card grid.

---

## Files Changed

| File | Change |
|---|---|
| `src/app/colleges/page.tsx` | Add STREAM_CATEGORY_MAP, update filter logic, add Top10Table render branch, update hero chips |
| `src/components/home/StudyGoalSection.tsx` | Update all 6 goal hrefs to `?stream=<GoalName>` |
| `src/scripts/seed-demo-colleges.ts` | Expand to 60+ colleges with realistic data |
| `src/app/globals.css` | Add `slideUp`, `fadeIn` keyframes and utility classes |

No schema changes. No new routes. No new dependencies.

---

## Out of Scope

- Application Deadline column (not in schema, not requested in final column list)
- Mobile filter panel improvements
- Pagination within the Top 10 table
- Real-time filtering (client-side) — remains server-rendered
