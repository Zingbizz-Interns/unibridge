'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Clock, IndianRupee, BookOpen, ArrowRight } from 'lucide-react'

const tabs = ['Bachelors', 'Masters', 'Doctorate', 'Diploma', 'Certification'] as const
type Tab = typeof tabs[number]

const tabToLevel: Record<Tab, string> = {
  Bachelors: 'ug',
  Masters: 'pg',
  Doctorate: 'doctorate',
  Diploma: 'diploma',
  Certification: 'certification',
}

interface Course {
  name: string
  duration: string
  fees: string
  colleges: number
}

const courses: Record<Tab, Course[]> = {
  Bachelors: [
    { name: 'B.Com General', duration: '3 Years', fees: '₹20K – 1.2L', colleges: 1842 },
    { name: 'BCA', duration: '3 Years', fees: '₹30K – 2.5L', colleges: 1245 },
    { name: 'BBA', duration: '3 Years', fees: '₹40K – 3L', colleges: 2100 },
    { name: 'BE / B.Tech (CSE)', duration: '4 Years', fees: '₹1L – 8L', colleges: 3200 },
    { name: 'MBBS', duration: '5.5 Years', fees: '₹5L – 25L', colleges: 560 },
    { name: 'BA English Honours', duration: '3 Years', fees: '₹8K – 80K', colleges: 4500 },
    { name: 'B.Sc Nursing', duration: '4 Years', fees: '₹50K – 3L', colleges: 980 },
    { name: 'LLB (3 Year)', duration: '3 Years', fees: '₹20K – 2L', colleges: 750 },
  ],
  Masters: [
    { name: 'MBA', duration: '2 Years', fees: '₹50K – 25L', colleges: 4200 },
    { name: 'M.Tech (CSE)', duration: '2 Years', fees: '₹40K – 4L', colleges: 1800 },
    { name: 'MCA', duration: '2 Years', fees: '₹25K – 2L', colleges: 1200 },
    { name: 'M.Com', duration: '2 Years', fees: '₹15K – 1L', colleges: 2100 },
    { name: 'MA Psychology', duration: '2 Years', fees: '₹20K – 1.5L', colleges: 850 },
    { name: 'M.Sc Data Science', duration: '2 Years', fees: '₹60K – 5L', colleges: 420 },
    { name: 'LLM', duration: '1 Year', fees: '₹25K – 2.5L', colleges: 380 },
    { name: 'M.Ed', duration: '2 Years', fees: '₹20K – 1.2L', colleges: 680 },
  ],
  Doctorate: [
    { name: 'PhD Computer Science', duration: '3–5 Years', fees: '₹30K – 2L', colleges: 450 },
    { name: 'PhD Management', duration: '3–5 Years', fees: '₹40K – 3L', colleges: 320 },
    { name: 'PhD Engineering', duration: '3–5 Years', fees: '₹25K – 2L', colleges: 580 },
    { name: 'PhD Economics', duration: '3–5 Years', fees: '₹20K – 1.5L', colleges: 280 },
    { name: 'PhD Life Sciences', duration: '3–5 Years', fees: '₹18K – 1.2L', colleges: 390 },
    { name: 'PhD Education', duration: '3–5 Years', fees: '₹15K – 1L', colleges: 210 },
    { name: 'PhD Chemistry', duration: '3–5 Years', fees: '₹20K – 1.5L', colleges: 340 },
    { name: 'PhD Mathematics', duration: '3–5 Years', fees: '₹15K – 1L', colleges: 260 },
  ],
  Diploma: [
    { name: 'Diploma in Engineering', duration: '3 Years', fees: '₹15K – 80K', colleges: 2800 },
    { name: 'Diploma in Computer App.', duration: '1 Year', fees: '₹10K – 50K', colleges: 1600 },
    { name: 'Diploma in Hotel Mgmt.', duration: '1–2 Years', fees: '₹20K – 1.5L', colleges: 480 },
    { name: 'Diploma in Pharmacy', duration: '2 Years', fees: '₹25K – 1L', colleges: 620 },
    { name: 'Diploma in Nursing', duration: '2 Years', fees: '₹30K – 1.2L', colleges: 540 },
    { name: 'Diploma in Architecture', duration: '3 Years', fees: '₹30K – 1.5L', colleges: 280 },
    { name: 'Diploma in Fashion Design', duration: '2 Years', fees: '₹40K – 2L', colleges: 320 },
    { name: 'Diploma in Journalism', duration: '1 Year', fees: '₹15K – 80K', colleges: 390 },
  ],
  Certification: [
    { name: 'Data Science & ML', duration: '6 Months', fees: '₹30K – 1.5L', colleges: 350 },
    { name: 'Digital Marketing', duration: '3–6 Months', fees: '₹15K – 80K', colleges: 520 },
    { name: 'Cloud Computing', duration: '3–6 Months', fees: '₹20K – 1.2L', colleges: 280 },
    { name: 'Cybersecurity', duration: '6 Months', fees: '₹25K – 2L', colleges: 190 },
    { name: 'UI/UX Design', duration: '3–4 Months', fees: '₹20K – 1L', colleges: 240 },
    { name: 'Full Stack Development', duration: '6 Months', fees: '₹30K – 1.5L', colleges: 310 },
    { name: 'Project Management (PMP)', duration: '3 Months', fees: '₹20K – 80K', colleges: 180 },
    { name: 'Financial Modelling', duration: '3 Months', fees: '₹15K – 70K', colleges: 160 },
  ],
}

export default function ExploreCoursesSection() {
  const [activeTab, setActiveTab] = useState<Tab>('Bachelors')

  return (
    <section className="bg-md-surface-container py-16">
      <div className="mx-auto max-w-7xl px-4">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-medium text-md-on-surface">Explore Courses</h2>
          <p className="mt-3 text-md-on-surface-variant max-w-md mx-auto">
            Browse thousands of programs across all levels and disciplines.
          </p>
        </div>

        {/* Tab filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none mb-8 justify-start sm:justify-center">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
                activeTab === tab
                  ? 'bg-md-primary text-md-on-primary shadow-sm'
                  : 'bg-md-surface text-md-on-surface-variant hover:bg-md-primary/10 hover:text-md-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Course cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courses[activeTab].map((course) => (
            <div
              key={course.name}
              className="group flex flex-col rounded-3xl bg-md-surface p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Full Time badge */}
              <span className="self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 mb-4 border border-emerald-100">
                Full Time
              </span>

              {/* Course name */}
              <h4 className="font-medium text-sm text-md-on-surface leading-snug mb-3 group-hover:text-md-primary transition-colors duration-200 flex-1">
                {course.name}
              </h4>

              {/* Meta */}
              <div className="space-y-2 text-xs text-md-on-surface-variant">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-md-primary/60" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3.5 w-3.5 shrink-0 text-md-primary/60" />
                  {course.fees} / year
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-md-primary/60" />
                  {course.colleges.toLocaleString('en-IN')} Colleges
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`/colleges?courseLevel=${tabToLevel[activeTab]}&stream=${encodeURIComponent(course.name)}`}
                className="mt-5 flex items-center justify-between rounded-full border border-md-outline/20 px-4 py-2.5 text-xs font-medium text-md-on-surface-variant group-hover:border-md-primary group-hover:text-md-primary group-hover:bg-md-primary/5 transition-all duration-200"
              >
                Course Overview
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          ))}
        </div>

        {/* Browse all */}
        <div className="mt-10 text-center">
          <Link
            href="/colleges"
            className="inline-flex rounded-full bg-md-primary px-8 py-3 text-sm font-medium text-md-on-primary shadow-sm hover:bg-md-primary/90 transition-all duration-200 active:scale-95"
          >
            Browse All {activeTab} Programs →
          </Link>
        </div>
      </div>
    </section>
  )
}
