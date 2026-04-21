'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { type FieldPath, useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  applicationSchema,
  type ApplicationFormData,
  type ApplicationFormInput,
} from '@/validators/application'

type Course = {
  id: string
  name: string
  degree: string | null
}

type Student = {
  name: string
  email: string
  phone: string
}

const totalSteps = 4

const stepFields: Record<number, FieldPath<ApplicationFormInput>[]> = {
  1: ['dob', 'gender', 'category', 'phone', 'address', 'city', 'state', 'pincode'],
  2: ['tenthPercent', 'twelfthPercent', 'entranceExam', 'entranceScore'],
  3: ['courseId'],
}

function getDraftStorageKey(collegeId: string) {
  return `application-draft:${collegeId}`
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function formatDate(value: string | undefined) {
  if (!value) {
    return 'Not provided'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatReviewValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 'Not provided'
  }

  return String(value)
}

export default function ApplicationForm({
  collegeId,
  collegeName,
  courses,
  student,
}: {
  collegeId: string
  collegeName: string
  courses: Course[]
  student: Student
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isDraftReady, setIsDraftReady] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormInput, undefined, ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      collegeId,
      phone: student.phone,
      dob: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      entranceExam: '',
    },
  })

  const storageKey = getDraftStorageKey(collegeId)
  const watchedValues = watch()
  const selectedCourse = courses.find((course) => course.id === watchedValues.courseId)

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(storageKey)

      if (rawDraft) {
        const parsed = JSON.parse(rawDraft) as {
          step?: number
          values?: Partial<ApplicationFormInput>
        }

        reset({
          collegeId,
          phone: student.phone,
          dob: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          entranceExam: '',
          ...parsed.values,
        })

        if (
          typeof parsed.step === 'number' &&
          parsed.step >= 1 &&
          parsed.step <= totalSteps
        ) {
          setStep(parsed.step)
        }
      }
    } catch (draftError) {
      console.error('Failed to restore saved application draft:', draftError)
      window.localStorage.removeItem(storageKey)
    } finally {
      setIsDraftReady(true)
    }
  }, [collegeId, reset, storageKey, student.phone])

  useEffect(() => {
    if (!isDraftReady) {
      return
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        step,
        values: watchedValues,
      })
    )
  }, [isDraftReady, step, storageKey, watchedValues])

  const handleNext = async () => {
    const fieldsToValidate = stepFields[step] || []
    const isValid = await trigger(fieldsToValidate)

    if (isValid) {
      setStep((currentStep) => Math.min(currentStep + 1, totalSteps))
    }
  }

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = (await response.json()) as {
        error?: string
        applicationId?: string
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application')
      }

      window.localStorage.removeItem(storageKey)
      router.push(
        result.applicationId
          ? `/dashboard/applications/${result.applicationId}`
          : '/dashboard/applications'
      )
      router.refresh()
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'Failed to submit application'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl rounded-3xl bg-md-surface p-6 shadow-sm border border-md-outline/10 md:p-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-md-primary">
          Application Form
        </p>
        <p className="mt-2 text-sm text-md-on-surface-variant">
          Drafts auto-save on this device while you move between steps.
        </p>
      </div>

      <div className="relative mb-12 flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -z-10 h-1 w-full -translate-y-1/2 bg-md-surface-container-high rounded-full"></div>
        <div
          className="absolute left-0 top-1/2 -z-10 h-1 -translate-y-1/2 bg-md-primary transition-all duration-300 rounded-full"
          style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>

        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              step >= item ? 'bg-md-primary text-md-on-primary shadow-sm' : 'bg-md-surface-container-high text-md-on-surface-variant'
            }`}
          >
            {item}
          </div>
        ))}
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl bg-md-error/10 p-4 text-sm text-md-error">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {step === 1 ? (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-md-on-surface border-b border-md-outline/10 pb-2">
              Personal Details
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  Name
                </label>
                <input
                  type="text"
                  value={student.name}
                  disabled
                  className="w-full rounded-2xl border border-md-outline/20 bg-md-surface-container-low px-4 py-3 text-md-on-surface-variant"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={student.email}
                  disabled
                  className="w-full rounded-2xl border border-md-outline/20 bg-md-surface-container-low px-4 py-3 text-md-on-surface-variant"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  Phone
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                />
                {errors.phone ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">{errors.phone.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  {...register('dob')}
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                />
                {errors.dob ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">{errors.dob.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  Gender
                </label>
                <select
                  {...register('gender')}
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">{errors.gender.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  Category
                </label>
                <select
                  {...register('category')}
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                >
                  <option value="">Select Category</option>
                  <option value="general">General</option>
                  <option value="obc">OBC</option>
                  <option value="sc">SC</option>
                  <option value="st">ST</option>
                  <option value="ews">EWS</option>
                </select>
                {errors.category ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">{errors.category.message}</p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  Address
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="Street address"
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                />
                {errors.address ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">{errors.address.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  City
                </label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                />
                {errors.city ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">{errors.city.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  State
                </label>
                <input
                  type="text"
                  {...register('state')}
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                />
                {errors.state ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">{errors.state.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  Pincode
                </label>
                <input
                  type="text"
                  {...register('pincode')}
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                />
                {errors.pincode ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">{errors.pincode.message}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-md-on-surface border-b border-md-outline/10 pb-2">
              Academic Details
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  10th Percentage
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('tenthPercent')}
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                />
                {errors.tenthPercent ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">
                    {errors.tenthPercent.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  12th Percentage
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('twelfthPercent')}
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                />
                {errors.twelfthPercent ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">
                    {errors.twelfthPercent.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  Entrance Exam (Optional)
                </label>
                <input
                  type="text"
                  {...register('entranceExam')}
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                />
                {errors.entranceExam ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">
                    {errors.entranceExam.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                  Entrance Score (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('entranceScore')}
                  className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
                />
                {errors.entranceScore ? (
                  <p className="mt-1 ml-1 text-sm text-md-error">
                    {errors.entranceScore.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-md-on-surface border-b border-md-outline/10 pb-2">
              Course Selection
            </h3>

            <div>
              <label className="mb-2 block text-sm font-medium text-md-on-surface ml-1">
                Select Course to Apply
              </label>
              <select
                {...register('courseId')}
                className="w-full rounded-2xl border border-md-outline/20 bg-transparent px-4 py-3 text-md-on-surface focus:border-md-primary focus:outline-none focus:ring-1 focus:ring-md-primary transition-shadow"
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} {course.degree ? `(${course.degree})` : ''}
                  </option>
                ))}
              </select>
              {errors.courseId ? (
                <p className="mt-1 ml-1 text-sm text-md-error">
                  {errors.courseId.message}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-md-primary/20 bg-md-primary/5 p-4 text-sm text-md-on-surface-variant flex items-start gap-4">
              <svg className="w-5 h-5 text-md-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>
                Select the course you want this application to be reviewed for.
                You can review everything one more time before submitting.
              </span>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-medium text-md-on-surface border-b border-md-outline/10 pb-2">
                Review & Submit
              </h3>
              <p className="mt-3 text-sm text-md-on-surface-variant ml-1">
                Double-check your details before sending them to <span className="font-medium text-md-on-surface">{collegeName}</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-md-outline/10 bg-md-surface-container-lowest p-5">
                <h4 className="font-medium text-md-on-surface text-lg">Applicant</h4>
                <div className="mt-4 space-y-3 text-sm text-md-on-surface-variant">
                  <p>
                    <strong className="text-md-on-surface font-medium">Name:</strong> {student.name}
                  </p>
                  <p>
                    <strong className="text-md-on-surface font-medium">Email:</strong> {student.email}
                  </p>
                  <p>
                    <strong className="text-md-on-surface font-medium">Phone:</strong>{' '}
                    {watchedValues.phone || 'Not provided'}
                  </p>
                  <p>
                    <strong className="text-md-on-surface font-medium">DOB:</strong>{' '}
                    {formatDate(watchedValues.dob)}
                  </p>
                  <p>
                    <strong className="text-md-on-surface font-medium">Gender:</strong>{' '}
                    <span className="capitalize">{watchedValues.gender || 'Not selected'}</span>
                  </p>
                  <p>
                    <strong className="text-md-on-surface font-medium">Category:</strong>{' '}
                    <span className="uppercase">{watchedValues.category || 'Not selected'}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-md-outline/10 bg-md-surface-container-lowest p-5">
                <h4 className="font-medium text-md-on-surface text-lg">Address</h4>
                <div className="mt-4 space-y-3 text-sm text-md-on-surface-variant">
                  <p>{watchedValues.address || 'Address not provided'}</p>
                  <p>
                    {[watchedValues.city, watchedValues.state]
                      .filter(Boolean)
                      .join(', ') || 'Location not provided'}
                  </p>
                  <p>
                    <strong className="text-md-on-surface font-medium">Pincode:</strong>{' '}
                    {watchedValues.pincode || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-md-outline/10 bg-md-surface-container-lowest p-5">
                <h4 className="font-medium text-md-on-surface text-lg">Academics</h4>
                <div className="mt-4 space-y-3 text-sm text-md-on-surface-variant">
                  <p>
                    <strong className="text-md-on-surface font-medium">10th:</strong>{' '}
                    {formatReviewValue(watchedValues.tenthPercent)}
                    {watchedValues.tenthPercent !== undefined &&
                    watchedValues.tenthPercent !== null &&
                    watchedValues.tenthPercent !== ''
                      ? '%'
                      : ''}
                  </p>
                  <p>
                    <strong className="text-md-on-surface font-medium">12th:</strong>{' '}
                    {formatReviewValue(watchedValues.twelfthPercent)}
                    {watchedValues.twelfthPercent !== undefined &&
                    watchedValues.twelfthPercent !== null &&
                    watchedValues.twelfthPercent !== ''
                      ? '%'
                      : ''}
                  </p>
                  <p>
                    <strong className="text-md-on-surface font-medium">Entrance Exam:</strong>{' '}
                    <span className="uppercase">{formatReviewValue(watchedValues.entranceExam)}</span>
                  </p>
                  <p>
                    <strong className="text-md-on-surface font-medium">Entrance Score:</strong>{' '}
                    {formatReviewValue(watchedValues.entranceScore)}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-md-outline/10 bg-md-surface-container-lowest p-5">
                <h4 className="font-medium text-md-on-surface text-lg">Selected Course</h4>
                <div className="mt-4 space-y-3 text-sm text-md-on-surface-variant">
                  <p className="text-md-primary font-medium text-base">
                    {selectedCourse
                      ? `${selectedCourse.name}${selectedCourse.degree ? ` (${selectedCourse.degree})` : ''}`
                      : 'No course selected'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-md-outline/10 bg-md-surface-container-low p-5 text-sm text-md-on-surface-variant flex items-start gap-4">
              <svg className="w-5 h-5 text-md-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>
                By submitting this application, you confirm that the information
                above is accurate. A confirmation email will be sent to{' '}
                <strong className="text-md-on-surface">{student.email}</strong>.
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-10 flex justify-between border-t border-md-outline/10 pt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 1))}
              className="inline-flex items-center justify-center rounded-full border border-md-outline/20 bg-transparent px-6 py-2.5 text-sm font-medium text-md-primary transition-colors hover:bg-md-primary/10"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center rounded-full bg-md-primary px-6 py-2.5 text-sm font-medium text-md-on-primary transition-colors hover:bg-md-primary/90"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !isDraftReady}
              className="inline-flex items-center justify-center rounded-full bg-md-primary px-6 py-2.5 text-sm font-medium text-md-on-primary transition-colors hover:bg-md-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
