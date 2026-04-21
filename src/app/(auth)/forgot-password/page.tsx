'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-md-surface p-4 overflow-hidden">
      {/* Decorative Blur Shapes */}
      <div className="absolute top-0 left-1/2 -translate-y-1/3 -translate-x-1/2 w-[500px] h-[500px] bg-md-primary/10 rounded-full blur-3xl mix-blend-multiply pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-[400px] h-[400px] bg-md-tertiary/10 rounded-[80px] blur-3xl mix-blend-multiply pointer-events-none" aria-hidden="true" />

      <Card className="max-w-md w-full relative z-10 shadow-sm border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl text-md-primary mb-2">Reset Password</CardTitle>
          <p className="text-md-on-surface-variant">Enter your email and we&apos;ll send you a link to reset your password.</p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-2xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-2xl mb-6 text-sm text-center">
              If you have an account, a reset link has been sent to your email.
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">Email</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending link...' : 'Send reset link'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col border-t border-md-outline/10 pt-6 mt-2">
          <p className="text-center text-sm text-md-on-surface-variant">
            Remember your password?{' '}
            <Button variant="ghost" size="sm" asChild className="px-1 h-auto">
              <Link href="/login">Sign in</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
