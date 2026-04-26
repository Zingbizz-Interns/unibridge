'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { ChevronDown, X, Search, Check, ArrowLeft, Building2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type College = { id: string; name: string; city: string | null; state: string | null }
type SelectedCollege = College | 'not-listed'

export default function CollegeRegisterPage() {
  const router = useRouter()

  // Step 1
  const [colleges, setColleges] = useState<College[]>([])
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<SelectedCollege | null>(null)
  const comboRef = useRef<HTMLDivElement>(null)

  // Wizard state
  const [step, setStep] = useState<1 | 2>(1)
  const [path, setPath] = useState<'claim' | 'new' | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  // Form fields
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    collegeName: '', counsellorName: '', counsellorPhone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/colleges/list').then(r => r.json()).then(setColleges)
  }, [])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const filtered = query === ''
    ? colleges
    : colleges.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.city ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (c.state ?? '').toLowerCase().includes(query.toLowerCase())
      )

  const displayValue =
    selected === 'not-listed'
      ? 'My college is not listed'
      : selected
      ? selected.name
      : ''

  function goToStep2() {
    if (!selected) return
    setTransitioning(true)
    setTimeout(() => {
      setPath(selected === 'not-listed' ? 'new' : 'claim')
      setStep(2)
      setTransitioning(false)
    }, 280)
  }

  function goBack() {
    setTransitioning(true)
    setTimeout(() => {
      setStep(1)
      setPath(null)
      setError('')
      setTransitioning(false)
    }, 280)
  }

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const body =
        path === 'claim'
          ? {
              existingCollegeId: (selected as College).id,
              adminName: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
              counsellorName: form.counsellorName || undefined,
              counsellorPhone: form.counsellorPhone || undefined,
            }
          : {
              collegeName: form.collegeName,
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
            }

      const res = await fetch('/api/auth/register/college', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      const signInRes = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      })

      if (signInRes?.error) {
        router.push('/login')
      } else {
        router.push(path === 'claim' ? '/college/claim-pending' : '/college/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-md-surface p-4 overflow-hidden">
      {/* Atmospheric blur shapes */}
      <div
        className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/3 w-[600px] h-[600px] bg-md-secondary-container/25 rounded-[100px] blur-3xl mix-blend-multiply pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[500px] h-[500px] bg-md-primary/8 rounded-full blur-3xl mix-blend-multiply pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-md-tertiary/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className={`max-w-md w-full relative z-10 transition-all duration-[280ms] ease-[cubic-bezier(0.2,0,0,1)] ${
          transitioning ? 'opacity-0 translate-y-3 scale-[0.99]' : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        <div className="bg-md-surface-container rounded-[32px] shadow-md p-8">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-md-secondary-container mb-4">
              <Building2 className="w-7 h-7 text-md-primary" />
            </div>
            <h1 className="text-2xl font-medium text-md-on-surface">
              {step === 1
                ? 'Find your college'
                : path === 'claim'
                ? 'Claim your college'
                : 'Register your college'}
            </h1>
            <p className="text-sm text-md-on-surface-variant mt-1">
              {step === 1
                ? 'Search from our network of colleges'
                : 'Create your admin account'}
            </p>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-7">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${
                step === 1 ? 'w-8 bg-md-primary' : 'w-2 bg-md-primary/30'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${
                step === 2 ? 'w-8 bg-md-primary' : 'w-2 bg-md-primary/30'
              }`}
            />
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              <div ref={comboRef} className="relative mb-5">
                <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">
                  Select your college
                </label>

                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setIsOpen(o => !o)}
                  className={`flex items-center h-14 w-full rounded-t-lg border-b-2 bg-md-surface-container-low px-4 text-left transition-colors duration-200 hover:bg-md-surface-container ${
                    isOpen ? 'border-md-primary' : 'border-md-outline'
                  }`}
                >
                  <span
                    className={`flex-1 text-sm truncate ${
                      selected ? 'text-md-on-surface' : 'text-md-on-surface-variant/60'
                    }`}
                  >
                    {selected ? displayValue : 'Search colleges...'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-md-on-surface-variant transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {isOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-md-surface-container rounded-2xl shadow-lg border border-md-outline/15 overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-md-outline/10">
                      <div className="flex items-center gap-2 bg-md-surface-container-low rounded-xl px-3 py-2">
                        <Search className="w-4 h-4 text-md-on-surface-variant shrink-0" />
                        <input
                          autoFocus
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          placeholder="Type to filter…"
                          className="flex-1 bg-transparent text-sm text-md-on-surface placeholder:text-md-on-surface-variant/50 outline-none"
                        />
                        {query && (
                          <button
                            onClick={e => { e.stopPropagation(); setQuery('') }}
                            className="text-md-on-surface-variant hover:text-md-on-surface transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-56 overflow-y-auto">
                      {filtered.slice(0, 60).map((college) => (
                        <button
                          key={college.id}
                          type="button"
                          onClick={() => {
                            setSelected(college)
                            setQuery('')
                            setIsOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-md-primary/5 transition-colors duration-150"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-md-on-surface truncate">
                              {college.name}
                            </p>
                            {(college.city || college.state) && (
                              <p className="text-xs text-md-on-surface-variant">
                                {[college.city, college.state].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                          {selected !== 'not-listed' && (selected as College | null)?.id === college.id && (
                            <Check className="w-4 h-4 text-md-primary shrink-0" />
                          )}
                        </button>
                      ))}

                      {filtered.length === 0 && (
                        <p className="text-sm text-md-on-surface-variant text-center py-4">
                          No colleges found
                        </p>
                      )}
                    </div>

                    {/* Not listed option */}
                    <div className="border-t border-md-outline/10">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected('not-listed')
                          setQuery('')
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-md-secondary-container/40 transition-colors duration-150"
                      >
                        <span className="text-sm font-medium text-md-primary">
                          My college is not listed →
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selection badge */}
              {selected && (
                <div className="flex items-center gap-2 mb-5 px-4 py-2.5 bg-md-secondary-container rounded-2xl">
                  <Check className="w-4 h-4 text-md-primary shrink-0" />
                  <span className="text-sm font-medium text-md-on-secondary-container flex-1 truncate">
                    {displayValue}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-md-on-secondary-container/50 hover:text-md-on-secondary-container transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <Button
                type="button"
                onClick={goToStep2}
                disabled={!selected}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div>
              {/* Back row */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={goBack}
                  className="p-2 rounded-full hover:bg-md-primary/10 transition-colors duration-200 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-md-primary" />
                </button>
                {path === 'claim' && selected !== 'not-listed' && selected && (
                  <div className="flex-1 min-w-0 px-3 py-1.5 bg-md-secondary-container rounded-full">
                    <p className="text-sm font-medium text-md-on-secondary-container truncate">
                      {selected.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {path === 'new' && (
                  <div>
                    <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">
                      College Name
                    </label>
                    <Input
                      required
                      value={form.collegeName}
                      onChange={field('collegeName')}
                      placeholder="e.g. Velammal Engineering College"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">
                    Admin Name
                  </label>
                  <Input
                    required
                    value={form.name}
                    onChange={field('name')}
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={field('email')}
                    placeholder="admin@college.edu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">
                    Contact Phone
                  </label>
                  <Input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={field('phone')}
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={field('password')}
                    placeholder="Min. 8 characters"
                  />
                </div>

                {path === 'claim' && (
                  <>
                    {/* Section divider */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 h-px bg-md-outline/15" />
                      <span className="text-xs text-md-on-surface-variant">Counsellor details (optional)</span>
                      <div className="flex-1 h-px bg-md-outline/15" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">
                        Counsellor Name
                      </label>
                      <Input
                        value={form.counsellorName}
                        onChange={field('counsellorName')}
                        placeholder="Counsellor's full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">
                        Counsellor Phone
                      </label>
                      <Input
                        type="tel"
                        value={form.counsellorPhone}
                        onChange={field('counsellorPhone')}
                        placeholder="9876543210"
                      />
                    </div>
                  </>
                )}

                <div className="pt-1">
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading
                      ? path === 'claim'
                        ? 'Submitting claim…'
                        : 'Creating account…'
                      : path === 'claim'
                      ? 'Submit Claim'
                      : 'Create Account'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-md-outline/10 text-center">
            <p className="text-sm text-md-on-surface-variant">
              Already registered?{' '}
              <Link
                href="/login"
                className="text-md-primary font-medium hover:underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
