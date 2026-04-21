import Link from 'next/link'
import { Landmark, Building2, Building, GraduationCap, Waves, BookOpen, Crown, Factory, TreePine, MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const cities: { name: string; Icon: LucideIcon; colleges: string }[] = [
  { name: 'Delhi NCR', Icon: Landmark, colleges: '2,400+' },
  { name: 'Bangalore', Icon: Building2, colleges: '1,800+' },
  { name: 'Hyderabad', Icon: Building, colleges: '1,200+' },
  { name: 'Pune', Icon: GraduationCap, colleges: '1,100+' },
  { name: 'Mumbai', Icon: Waves, colleges: '980+' },
  { name: 'Chennai', Icon: MapPin, colleges: '850+' },
  { name: 'Kolkata', Icon: BookOpen, colleges: '760+' },
  { name: 'Jaipur', Icon: Crown, colleges: '540+' },
  { name: 'Ahmedabad', Icon: Factory, colleges: '480+' },
  { name: 'Chandigarh', Icon: TreePine, colleges: '320+' },
]

export default function TopStudyPlaces() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        {/* Heading row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-medium text-md-on-surface">Top Study Places</h2>
            <p className="mt-2 text-md-on-surface-variant">
              Explore colleges in India&apos;s top educational cities
            </p>
          </div>
          <Link
            href="/colleges"
            className="hidden sm:inline-flex rounded-full border border-md-outline/30 px-5 py-2 text-sm font-medium text-md-on-surface-variant hover:bg-md-primary/10 hover:text-md-primary hover:border-md-primary/30 transition-all duration-200 active:scale-95"
          >
            View All →
          </Link>
        </div>

        {/* Horizontal scroll row */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory -mx-4 px-4">
          {cities.map((city) => (
            <Link
              key={city.name}
              href={`/colleges?city=${encodeURIComponent(city.name)}`}
              className="group shrink-0 snap-start flex flex-col items-center rounded-3xl bg-md-surface-container p-6 w-36 hover:bg-md-primary hover:shadow-lg transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-md-surface text-md-primary group-hover:bg-white/20 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                <city.Icon className="h-6 w-6" />
              </div>
              <span className="font-medium text-sm text-md-on-surface group-hover:text-white transition-colors duration-300 text-center leading-snug">
                {city.name}
              </span>
              <span className="text-xs text-md-on-surface-variant group-hover:text-white/70 transition-colors duration-300 mt-1">
                {city.colleges} Colleges
              </span>
            </Link>
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/colleges"
            className="inline-flex rounded-full border border-md-outline/30 px-6 py-2.5 text-sm font-medium text-md-on-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-all duration-200"
          >
            View All Cities →
          </Link>
        </div>
      </div>
    </section>
  )
}
