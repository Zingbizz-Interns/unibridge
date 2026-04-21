const stats = [
  { value: '35,000+', label: 'Colleges' },
  { value: '500+', label: 'Exams Covered' },
  { value: '1M+', label: 'Students Helped' },
  { value: '50+', label: 'Cities' },
  { value: '10,000+', label: 'Courses' },
]

export default function StatsBar() {
  return (
    <div className="mx-auto max-w-5xl px-4 mt-10 mb-2">
      <div className="grid grid-cols-2 sm:grid-cols-5 rounded-3xl overflow-hidden border border-md-outline/10 divide-x divide-md-outline/10 shadow-sm">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col items-center justify-center py-5 px-4 bg-md-surface-container text-center ${
              i === stats.length - 1 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <span className="text-2xl font-medium text-md-primary">{s.value}</span>
            <span className="text-xs text-md-on-surface-variant mt-1">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
