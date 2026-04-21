'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, MapPin, Users, Star } from 'lucide-react'
import iitImage from '@/assets/IIT.jpg'
import iimImage from '@/assets/IIM.jpeg'
import aiimsImage from '@/assets/AIIMS.jpg'

const slides = [
  {
    id: 0,
    college: 'Indian Institute of Technology, Delhi',
    location: 'New Delhi',
    tagline: "India's Premier Engineering Institute",
    rank: '#1 in Engineering',
    students: '12,000+',
    founded: '1961',
    accentColor: '#a78bfa',
    image: iitImage,
  },
  {
    id: 1,
    college: 'Indian Institute of Management, Ahmedabad',
    location: 'Ahmedabad, Gujarat',
    tagline: "Shaping India's Business Leaders Since 1961",
    rank: '#1 in Management',
    students: '4,200+',
    founded: '1961',
    accentColor: '#4dd0e1',
    image: iimImage,
  },
  {
    id: 2,
    college: 'All India Institute of Medical Sciences',
    location: 'New Delhi',
    tagline: 'Centre of Excellence in Medical Education',
    rank: '#1 in Medical',
    students: '3,500+',
    founded: '1956',
    accentColor: '#f48fb1',
    image: aiimsImage,
  },
]

const suggestions = ['Top Engineering Colleges', 'MBA Admission 2025', 'NEET Cutoff 2025', 'Best Colleges in Delhi']

export default function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    const q = query.trim()
    router.push(q ? `/colleges?q=${encodeURIComponent(q)}` : '/colleges')
  }

  const go = useCallback((idx: number) => {
    setCurrent(((idx % slides.length) + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    const t = setInterval(() => go(current + 1), 5000)
    return () => clearInterval(t)
  }, [current, go])

  return (
    <section className="relative">
      {/* Carousel */}
      <div className="relative h-[460px] sm:h-[520px] overflow-hidden">
        {slides.map((s, i) => (
          <div
            key={s.id}
            aria-hidden={i !== current}
            className={`absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.2,0,0,1)] ${
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background image */}
            <Image
              src={s.image}
              alt={s.college}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="100vw"
            />

            {/* Shadow overlay so text is legible */}
            <div className="absolute inset-0 bg-black/55 pointer-events-none" />

            {/* Subtle accent glow */}
            <div
              className="absolute -right-20 -top-20 h-80 w-80 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: s.accentColor }}
            />

            {/* Slide content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center pb-28">
              <span
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
              >
                <Star className="h-3 w-3" style={{ color: s.accentColor }} fill={s.accentColor} />
                {s.rank}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white leading-tight max-w-2xl tracking-tight">
                {s.college}
              </h2>
              <p className="mt-3 text-base sm:text-lg text-white/65 max-w-lg">{s.tagline}</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-sm text-white/55">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {s.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {s.students} Students
                </span>
                <span>Est. {s.founded}</span>
              </div>
              <Link
                href="/colleges"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-7 py-2.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/22 transition-all duration-300 active:scale-95"
              >
                View College →
              </Link>
            </div>
          </div>
        ))}

        {/* Prev arrow */}
        <button
          onClick={() => go(current - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/45 transition-all duration-200 active:scale-95"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Next arrow */}
        <button
          onClick={() => go(current + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/45 transition-all duration-200 active:scale-95"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Slide indicator dots */}
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 active:scale-90 ${
                i === current ? 'w-8 bg-white' : 'w-2 bg-white/35 hover:bg-white/55'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Floating Search Bar */}
      <div className="relative z-30 -mt-16 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-md-surface shadow-2xl border border-md-outline/10 p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-md-primary/10">
                <Search className="h-5 w-5 text-md-primary" />
              </div>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search for Colleges, Exams, Courses and More…"
                className="flex-1 bg-transparent text-base text-md-on-surface placeholder:text-md-on-surface-variant/55 focus:outline-none"
              />
              <button
                onClick={handleSearch}
                className="shrink-0 rounded-full bg-md-primary px-6 py-2.5 text-sm font-medium text-md-on-primary shadow-sm hover:bg-md-primary/90 transition-all duration-200 active:scale-95"
              >
                Search
              </button>
            </div>

            {/* Quick suggestions */}
            <div className="mt-3 flex flex-wrap gap-2 px-1">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="rounded-full bg-md-secondary-container px-3 py-1 text-xs font-medium text-md-on-secondary-container hover:bg-md-primary hover:text-md-on-primary transition-all duration-200 active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
