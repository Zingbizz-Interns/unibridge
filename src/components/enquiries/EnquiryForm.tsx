'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  enquirySchema,
  type EnquiryData,
  type EnquiryInput,
} from '@/validators/enquiry'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to send enquiry.'
}

export default function EnquiryForm({
  collegeId,
  collegeName,
  currentUser,
}: {
  collegeId: string
  collegeName: string
  currentUser?: {
    name?: string | null
    email?: string | null
    phone?: string | null
  } | null
}) {
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryInput, undefined, EnquiryData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      collegeId,
      name: currentUser?.name ?? '',
      email: currentUser?.email ?? '',
      phone: currentUser?.phone ?? '',
      message: '',
    },
  })

  const onSubmit = async (data: EnquiryData) => {
    setServerError('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send enquiry.')
      }

      setSuccessMessage(`Your message has been sent to ${collegeName}.`)
      reset({
        collegeId,
        name: currentUser?.name ?? '',
        email: currentUser?.email ?? '',
        phone: currentUser?.phone ?? '',
        message: '',
      })
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  }

  return (
    <Card elevation="elevated">
      <CardHeader>
        <CardTitle className="text-2xl">Contact Counsellor</CardTitle>
        <CardDescription>
          Send a message directly to the admissions team. We&apos;ll forward it and email you a confirmation copy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" value={collegeId} {...register('collegeId')} />

          {serverError && (
            <div className="rounded-2xl bg-errorContainer px-4 py-3 text-sm text-onErrorContainer">
              {serverError}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl bg-green-100 px-4 py-3 text-sm text-green-800">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="enquiryName" className="mb-1 block text-sm font-medium text-md-on-surface">
                Name
              </label>
              <Input id="enquiryName" {...register('name')} placeholder="Your full name" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="enquiryEmail" className="mb-1 block text-sm font-medium text-md-on-surface">
                Email
              </label>
              <Input id="enquiryEmail" {...register('email')} type="email" placeholder="you@example.com" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="enquiryPhone" className="mb-1 block text-sm font-medium text-md-on-surface">
              Phone (optional)
            </label>
            <Input id="enquiryPhone" {...register('phone')} placeholder="10-digit mobile number" />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="enquiryMessage" className="mb-1 block text-sm font-medium text-md-on-surface">
              Message
            </label>
            <textarea
              id="enquiryMessage"
              {...register('message')}
              rows={6}
              maxLength={1000}
              placeholder={`Ask ${collegeName} about admissions, fees, scholarships, or counselling support.`}
              className="w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 py-3 text-base text-md-on-surface placeholder:text-md-on-surface-variant/60 focus:border-md-primary focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.message ? (
                <p className="text-xs text-red-600">{errors.message.message}</p>
              ) : (
                <span className="text-xs text-md-on-surface-variant">Minimum 10 characters, maximum 1000.</span>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Enquiry'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
