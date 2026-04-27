'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { verificationDocumentOptions } from '@/lib/college-content'
import { getDashboardPath } from '@/lib/dashboard'
import { INDIAN_STATES, type CollegeProfileInput } from '@/validators/college-profile'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

type UploadErrorKind = 'size' | 'general'
type WizardStep = { title: string; detail: string }

const onboardingSteps: WizardStep[] = [
  { title: 'Institution Details', detail: 'Basic info' },
  { title: 'Academic Info', detail: 'Counsellor & cut-offs' },
  { title: 'Documents', detail: 'Upload & verify' },
]

const NAAC_GRADES = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'Not Accredited'] as const

const CITIES_BY_STATE: Record<string, readonly string[]> = {
  'Andhra Pradesh': ['Vijayawada', 'Visakhapatnam', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Nandyal'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Bomdila'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai', 'Bihar Sharif'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Ambikapur'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand', 'Navsari', 'Mehsana', 'Junagadh'],
  'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat'],
  'Himachal Pradesh': ['Shimla', 'Mandi', 'Dharamshala', 'Solan', 'Kullu', 'Hamirpur', 'Palampur', 'Baddi'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Ballari', 'Tumakuru', 'Shivamogga', 'Davanagere', 'Vijayapura', 'Kalaburagi', 'Bidar', 'Hassan', 'Udupi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur', 'Malappuram', 'Kottayam'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Satna', 'Dewas', 'Ratlam', 'Rewa'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Nanded', 'Thane', 'Pimpri-Chinchwad', 'Akola', 'Latur'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Jharsuguda'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Pathankot'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode', 'Tiruppur', 'Thoothukudi', 'Thanjavur', 'Dindigul', 'Sivakasi', 'Kanchipuram', 'Cuddalore', 'Hosur', 'Kumbakonam'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Secunderabad', 'Nalgonda'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Ghaziabad', 'Noida', 'Bareilly', 'Aligarh', 'Mathura', 'Moradabad', 'Gorakhpur', 'Saharanpur'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Kashipur', 'Rudrapur', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Jalpaiguri', 'Kharagpur'],
  'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
  'Delhi': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Pitampura', 'Saket'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
}

const COLLEGE_TYPE_VALUES = ['affiliated', 'university', 'autonomous'] as const
type CollegeTypeValue = (typeof COLLEGE_TYPE_VALUES)[number]

// ---- Schemas ----

const step1Schema = z.object({
  name: z.string().trim().min(1, 'College name is required').max(500),
  collegeType: z.string().refine(
    (v) => COLLEGE_TYPE_VALUES.includes(v as CollegeTypeValue),
    { message: 'College category is required' }
  ),
  affiliation: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().refine((v) => !v || /^\d{6}$/.test(v), { message: 'Must be exactly 6 digits' }).optional(),
  nirfRank: z.string().refine((v) => !v || (/^\d+$/.test(v) && parseInt(v) > 0), { message: 'Must be a positive number' }).optional(),
  website: z.string().refine((v) => !v || v.startsWith('http'), { message: 'Must include https://' }).optional(),
  naacGrade: z.string().optional(),
})

type Step1FormValues = z.infer<typeof step1Schema>

type Step1ApiData = {
  name: string
  collegeType: CollegeTypeValue
  affiliation?: string
  city?: string
  state?: string
  pincode?: string
  nirfRank?: number
  website?: string
  naacGrade?: string
}

const step2Schema = z.object({
  counsellorName: z.string().optional(),
  counsellorPhone: z.string().refine(
    (v) => !v || /^\d{10}$/.test(v),
    { message: 'Enter a valid 10-digit number' }
  ).optional(),
  engineeringCutoff: z.string().refine(
    (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 200),
    { message: 'Must be between 0 and 200' }
  ).optional(),
  medicalCutoff: z.string().refine(
    (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 200),
    { message: 'Must be between 0 and 200' }
  ).optional(),
})

type Step2FormValues = z.infer<typeof step2Schema>

// ---- Utilities ----

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

function str(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return ''
}

const selectCls =
  'md-input-glow h-14 w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 text-md-on-surface transition-all duration-200 focus:border-md-primary focus:outline-none focus-visible:outline-none'

// ---- Design Components ----

function StepTimeline({ current, steps }: { current: number; steps: WizardStep[] }) {
  return (
    <div>
      {/* Nodes + connectors */}
      <div className="grid grid-cols-[1fr_2fr_1fr_2fr_1fr] items-center gap-0">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < current
          const isActive = stepNumber === current

          return (
            <React.Fragment key={step.title}>
              {/* Step node */}
              <div className="flex justify-center">
                <div className="relative">
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute rounded-full bg-md-primary/20 animate-ping"
                      style={{ inset: '-6px' }}
                    />
                  )}
                  <div
                    className={[
                      'relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]',
                      isComplete
                        ? 'bg-md-primary shadow-md'
                        : isActive
                          ? 'bg-md-primary shadow-lg scale-110'
                          : 'bg-md-surface-container-high border-2 border-md-outline',
                    ].join(' ')}
                  >
                    {isComplete ? (
                      <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-md-on-surface-variant'}`}>
                        {stepNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Connector (not after last step) */}
              {index < steps.length - 1 && (
                <div className="h-0.5 bg-md-surface-container-low rounded-full overflow-hidden mx-1">
                  <div
                    className={[
                      'h-full bg-md-primary rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]',
                      isComplete ? 'w-full' : 'w-0',
                    ].join(' ')}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Labels */}
      <div className="grid grid-cols-3 mt-3">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < current
          const isActive = stepNumber === current
          const align = index === 0 ? 'text-left' : index === steps.length - 1 ? 'text-right' : 'text-center'

          return (
            <p
              key={step.title}
              className={[
                'text-[11px] font-medium leading-tight transition-colors duration-300',
                align,
                isActive
                  ? 'text-md-primary'
                  : isComplete
                    ? 'text-md-on-surface-variant'
                    : 'text-md-on-surface-variant/40',
              ].join(' ')}
            >
              {step.title}
            </p>
          )
        })}
      </div>
    </div>
  )
}

function UploadErrorBanner({ kind, message }: { kind: UploadErrorKind | null; message: string }) {
  if (!message) return null
  const isSizeError = kind === 'size'
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
      isSizeError ? 'border-red-200 bg-red-50 text-red-700' : 'border-transparent bg-red-50 text-red-700'
    }`}>
      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <div>
        <p className="font-semibold">{isSizeError ? 'File too large' : 'Upload failed'}</p>
        <p className="mt-0.5 opacity-90">{message}</p>
      </div>
    </div>
  )
}

function Req() {
  return <span className="ml-0.5 text-red-500" aria-hidden>*</span>
}

function FieldLabel({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-md-on-surface">
      {children}{required && <Req />}
    </label>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-md-primary">{children}</p>
      <div className="flex-1 h-px bg-md-surface-container-low" />
    </div>
  )
}

function FileUploadWidget({
  id,
  label,
  required,
  hint,
  file,
  onChange,
  disabled,
  hasError,
  accept = '.pdf,.jpg,.jpeg,.png',
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  file: File | null
  onChange: (f: File | null) => void
  disabled?: boolean
  hasError?: boolean
  accept?: string
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const dropped = e.dataTransfer.files[0]
    if (dropped) onChange(dropped)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-md-on-surface">
        {label}{required && <Req />}
      </p>
      {hint && <p className="text-xs text-md-on-surface-variant">{hint}</p>}

      {file ? (
        /* File chip */
        <div className="flex items-center gap-3 rounded-2xl border border-md-primary/30 bg-md-primary/5 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-md-primary/15">
            <svg className="h-5 w-5 text-md-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-md-on-surface">{file.name}</p>
            <p className="text-xs text-md-on-surface-variant">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-md-on-surface-variant transition-colors hover:bg-md-surface-container-low hover:text-md-on-surface active:scale-95"
              aria-label="Remove file"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            'rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
            disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer',
            isDragging
              ? 'border-md-primary bg-md-primary/8 scale-[1.01]'
              : hasError
                ? 'border-red-400 bg-red-50'
                : 'border-md-outline/50 hover:border-md-primary/50 hover:bg-md-primary/5',
          ].join(' ')}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
          aria-label={`Upload ${label}`}
        >
          <input
            ref={inputRef}
            type="file"
            id={id}
            accept={accept}
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            className="sr-only"
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-3">
            <div className={[
              'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300',
              isDragging ? 'bg-md-primary text-white' : 'bg-md-secondary-container text-md-on-secondary-container',
            ].join(' ')}>
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-md-on-surface">
                {isDragging ? 'Drop file here' : 'Click to upload or drag & drop'}
              </p>
              <p className="mt-1 text-xs text-md-on-surface-variant">PDF, PNG, JPG — up to 10 MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Step 1: Institution Details ----

function InstitutionDetailsStep({
  initialProfile,
  onComplete,
}: {
  initialProfile: CollegeProfileInput
  onComplete: (apiData: Step1ApiData) => void
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: str(initialProfile.name),
      collegeType: str(initialProfile.collegeType),
      affiliation: str(initialProfile.affiliation),
      address: '',
      state: str(initialProfile.state),
      city: str(initialProfile.city),
      pincode: str(initialProfile.pincode),
      nirfRank: str(initialProfile.nirfRank),
      website: str(initialProfile.website),
      naacGrade: str(initialProfile.naacGrade),
    },
  })

  const [serverError, setServerError] = useState('')
  const collegeType = watch('collegeType')
  const selectedState = watch('state')
  const citiesForState = selectedState ? (CITIES_BY_STATE[selectedState] ?? []) : []

  const onSubmit = async (data: Step1FormValues) => {
    setServerError('')

    const apiPayload = {
      name: data.name,
      collegeType: data.collegeType as CollegeTypeValue,
      affiliation: data.affiliation || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      pincode: data.pincode || undefined,
      nirfRank: data.nirfRank ? parseInt(data.nirfRank, 10) : undefined,
      website: data.website || undefined,
      naacGrade: data.naacGrade || undefined,
    }

    const res = await fetch('/api/college/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload),
    })

    const json = await res.json()
    if (!res.ok) {
      setServerError(json.error || 'Failed to save profile')
      return
    }

    onComplete(apiPayload)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p>{serverError}</p>
        </div>
      )}

      {/* College identity */}
      <div className="space-y-4">
        <div>
          <FieldLabel htmlFor="name" required>College name</FieldLabel>
          <Input id="name" {...register('name')} placeholder="e.g. Sri Venkateswara College of Engineering" className="md-input-glow" />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="collegeType" required>College category</FieldLabel>
            <select id="collegeType" {...register('collegeType')} className={selectCls}>
              <option value="">— Select Category —</option>
              <option value="affiliated">Affiliated</option>
              <option value="university">University</option>
              <option value="autonomous">Autonomous</option>
            </select>
            {errors.collegeType && <p className="mt-1.5 text-xs text-red-500">{errors.collegeType.message}</p>}
          </div>

          {collegeType === 'affiliated' && (
            <div>
              <FieldLabel htmlFor="affiliation">Affiliated body</FieldLabel>
              <Input id="affiliation" {...register('affiliation')} placeholder="e.g. Anna University" className="md-input-glow" />
              {errors.affiliation && <p className="mt-1.5 text-xs text-red-500">{errors.affiliation.message}</p>}
            </div>
          )}
        </div>
      </div>

      <SectionHeading>Location & Address</SectionHeading>

      <div className="space-y-4">
        <div>
          <FieldLabel htmlFor="address">College address</FieldLabel>
          <textarea
            id="address"
            {...register('address')}
            rows={2}
            placeholder="Street address, landmark..."
            className="md-input-glow w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 py-3 text-base text-md-on-surface transition-all duration-200 placeholder:text-md-on-surface-variant/50 focus:border-md-primary focus:outline-none resize-none"
          />
          {errors.address && <p className="mt-1.5 text-xs text-red-500">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="state">State</FieldLabel>
            <select
              id="state"
              {...register('state', { onChange: () => setValue('city', '') })}
              className={selectCls}
            >
              <option value="">— Select state —</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <p className="mt-1.5 text-xs text-red-500">{errors.state.message}</p>}
          </div>
          <div>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <select
              id="city"
              {...register('city')}
              disabled={citiesForState.length === 0}
              className={`${selectCls} ${citiesForState.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">{citiesForState.length === 0 ? '— Select a state first —' : '— Select city —'}</option>
              {citiesForState.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.city && <p className="mt-1.5 text-xs text-red-500">{errors.city.message}</p>}
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
          <Input id="pincode" {...register('pincode')} placeholder="e.g. 600036" maxLength={6} className="md-input-glow" />
          {errors.pincode && <p className="mt-1.5 text-xs text-red-500">{errors.pincode.message}</p>}
        </div>
      </div>

      <SectionHeading>Rankings & Web</SectionHeading>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="naacGrade">NAAC grade</FieldLabel>
          <select id="naacGrade" {...register('naacGrade')} className={selectCls}>
            <option value="">— Select —</option>
            {NAAC_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          {errors.naacGrade && <p className="mt-1.5 text-xs text-red-500">{errors.naacGrade.message}</p>}
        </div>
        <div>
          <FieldLabel htmlFor="nirfRank">NIRF rank</FieldLabel>
          <Input id="nirfRank" {...register('nirfRank')} placeholder="e.g. 42" className="md-input-glow" />
          {errors.nirfRank && <p className="mt-1.5 text-xs text-red-500">{errors.nirfRank.message}</p>}
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="website">Website</FieldLabel>
        <Input id="website" {...register('website')} placeholder="https://college.edu.in" className="md-input-glow" />
        {errors.website && <p className="mt-1.5 text-xs text-red-500">{errors.website.message}</p>}
      </div>

      <Button type="submit" variant="default" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Save & Continue
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </Button>
    </form>
  )
}

// ---- Step 2: Academic Info ----

function AcademicInfoStep({
  initialProfile,
  step1ApiData,
  onComplete,
}: {
  initialProfile: CollegeProfileInput
  step1ApiData: Step1ApiData
  onComplete: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      counsellorName: '',
      counsellorPhone: str(initialProfile.counsellorPhone),
      engineeringCutoff: str(initialProfile.engineeringCutoff),
      medicalCutoff: str(initialProfile.medicalCutoff),
    },
  })

  const [serverError, setServerError] = useState('')

  const onSubmit = async (data: Step2FormValues) => {
    setServerError('')

    const apiPayload = {
      ...step1ApiData,
      counsellorPhone: data.counsellorPhone || undefined,
      engineeringCutoff: data.engineeringCutoff ? Number(data.engineeringCutoff) : undefined,
      medicalCutoff: data.medicalCutoff ? Number(data.medicalCutoff) : undefined,
    }

    const res = await fetch('/api/college/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload),
    })

    const json = await res.json()
    if (!res.ok) {
      setServerError(json.error || 'Failed to save')
      return
    }

    onComplete()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{serverError}</p>
        </div>
      )}

      <SectionHeading>Counsellor</SectionHeading>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="counsellorName">Counsellor name</FieldLabel>
          <Input id="counsellorName" {...register('counsellorName')} placeholder="e.g. Mrs. Lakshmi" className="md-input-glow" />
          {errors.counsellorName && <p className="mt-1.5 text-xs text-red-500">{errors.counsellorName.message}</p>}
        </div>
        <div>
          <FieldLabel htmlFor="counsellorPhone">Counsellor mobile</FieldLabel>
          <Input id="counsellorPhone" {...register('counsellorPhone')} placeholder="9876543210" maxLength={10} className="md-input-glow" />
          {errors.counsellorPhone && <p className="mt-1.5 text-xs text-red-500">{errors.counsellorPhone.message}</p>}
        </div>
      </div>

      <SectionHeading>Cut-offs</SectionHeading>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="engineeringCutoff">Engineering cut-off (out of 200)</FieldLabel>
          <Input id="engineeringCutoff" {...register('engineeringCutoff')} placeholder="e.g. 178.50" className="md-input-glow" />
          {errors.engineeringCutoff && <p className="mt-1.5 text-xs text-red-500">{errors.engineeringCutoff.message}</p>}
        </div>
        <div>
          <FieldLabel htmlFor="medicalCutoff">Medical cut-off (out of 200)</FieldLabel>
          <Input id="medicalCutoff" {...register('medicalCutoff')} placeholder="e.g. 181.25" className="md-input-glow" />
          {errors.medicalCutoff && <p className="mt-1.5 text-xs text-red-500">{errors.medicalCutoff.message}</p>}
        </div>
      </div>

      <Button type="submit" variant="default" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Save & Continue
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </Button>
    </form>
  )
}

// ---- Upload helpers ----

async function signAndUpload(file: File, bucket: 'verification' | 'publicDocuments') {
  const signRes = await fetch('/api/storage/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size, bucket }),
  })
  const signData = await signRes.json()
  if (!signRes.ok) throw new Error(signData.error || 'Failed to sign upload')

  const uploadRes = await fetch(signData.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!uploadRes.ok) throw new Error('Failed to upload file to storage')

  return signData.path as string
}

async function uploadVerificationDoc(file: File, docType: string) {
  const path = await signAndUpload(file, 'verification')
  const docRes = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: docType, fileName: file.name, storagePath: path }),
  })
  const docData = await docRes.json()
  if (!docRes.ok) throw new Error(docData.error || 'Failed to save document record')
}

async function uploadBrochure(file: File) {
  const path = await signAndUpload(file, 'publicDocuments')
  const docRes = await fetch('/api/college/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'brochure', fileName: file.name, storagePath: path }),
  })
  const docData = await docRes.json()
  if (!docRes.ok) throw new Error(docData.error || 'Failed to save brochure record')
}

// ---- Step 3: Documents ----

function DocumentStep() {
  const router = useRouter()
  const [verificationFile, setVerificationFile] = useState<File | null>(null)
  const [brochureFile, setBrochureFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('naac_certificate')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [errorKind, setErrorKind] = useState<UploadErrorKind | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!verificationFile) return

    if (verificationFile.size > MAX_FILE_SIZE_BYTES) {
      setError('Verification document must be smaller than 10 MB.')
      setErrorKind('size')
      return
    }
    if (brochureFile && brochureFile.size > MAX_FILE_SIZE_BYTES) {
      setError('Brochure must be smaller than 10 MB.')
      setErrorKind('size')
      return
    }

    setUploading(true)
    setError('')
    setErrorKind(null)

    try {
      await uploadVerificationDoc(verificationFile, documentType)
      if (brochureFile) await uploadBrochure(brochureFile)

      const verifyRes = await fetch('/api/college/submit-verification', { method: 'POST' })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Failed to submit verification')

      setSuccess(true)
      setTimeout(() => {
        router.push(getDashboardPath('college'))
        router.refresh()
      }, 2000)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
      setErrorKind('general')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <UploadErrorBanner kind={errorKind} message={error} />

      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-4 text-emerald-700">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold">Documents uploaded!</p>
            <p className="text-xs opacity-80">Verification is pending admin review. Redirecting…</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <FieldLabel htmlFor="documentType" required>Verification document type</FieldLabel>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className={selectCls}
            disabled={uploading || success}
          >
            {verificationDocumentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-md-on-surface-variant">
            At least one accreditation or approval document is required for verification.
          </p>
        </div>

        <FileUploadWidget
          id="verificationFile"
          label="Verification document"
          required
          file={verificationFile}
          onChange={setVerificationFile}
          disabled={uploading || success}
          hasError={errorKind === 'size' && !!verificationFile}
        />
      </div>

      <div className="h-px bg-md-surface-container-low" />

      <FileUploadWidget
        id="brochureFile"
        label="College brochure"
        hint="Optional — PDF only. Helps students download your institution brochure directly."
        file={brochureFile}
        onChange={setBrochureFile}
        disabled={uploading || success}
        accept=".pdf"
      />

      <Button
        type="submit"
        variant="default"
        size="lg"
        className="w-full"
        disabled={!verificationFile || uploading || success}
      >
        {uploading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading & Submitting…
          </span>
        ) : (
          'Submit for Verification'
        )}
      </Button>
    </form>
  )
}

// ---- Main wizard ----

const STEP_TITLES = [
  'Complete Your College Profile',
  'Academic Information',
  'Upload Verification Document',
]

const STEP_DESCRIPTIONS = [
  'Tell us about your institution before submitting for verification.',
  'Share the programs and streams your college offers.',
  'Upload documents so our admin team can verify your college.',
]

export function CollegeOnboardingClient({ initialProfile }: { initialProfile: CollegeProfileInput }) {
  const [step, setStep] = useState(1)
  const [animKey, setAnimKey] = useState(0)
  const [step1ApiData, setStep1ApiData] = useState<Step1ApiData | null>(null)

  const goToStep = (next: number) => {
    setStep(next)
    setAnimKey((k) => k + 1)
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Organic background decorations */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-32 h-80 w-80 rounded-full bg-md-primary/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-24 h-64 w-64 rounded-full bg-md-secondary-container/50 blur-3xl"
      />

      <Card elevation="elevated" className="relative border-0">
        <CardHeader className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-md-primary">
              Onboarding Wizard
            </p>
            <CardTitle className="mt-1 text-2xl font-medium text-md-on-surface">
              {STEP_TITLES[step - 1]}
            </CardTitle>
            <CardDescription className="mt-1">{STEP_DESCRIPTIONS[step - 1]}</CardDescription>
          </div>

          <StepTimeline current={step} steps={onboardingSteps} />
        </CardHeader>

        <CardContent>
          {/* Key triggers re-mount animation on step change */}
          <div key={animKey} className="animate-step-enter">
            {step === 1 && (
              <InstitutionDetailsStep
                initialProfile={initialProfile}
                onComplete={(data) => {
                  setStep1ApiData(data)
                  goToStep(2)
                }}
              />
            )}
            {step === 2 && step1ApiData && (
              <AcademicInfoStep
                initialProfile={initialProfile}
                step1ApiData={step1ApiData}
                onComplete={() => goToStep(3)}
              />
            )}
            {step === 3 && <DocumentStep />}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

