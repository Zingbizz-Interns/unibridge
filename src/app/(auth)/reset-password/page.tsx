'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-md-surface p-4">
      <Card className="max-w-md w-full shadow-sm border-0 text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-md-primary">Loading reset form</CardTitle>
          <p className="text-md-on-surface-variant text-sm mt-2">Checking your reset link details...</p>
        </CardHeader>
      </Card>
    </div>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-md-surface p-4">
        <Card className="max-w-md w-full shadow-sm border-0 text-center">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Invalid Link</CardTitle>
            <p className="text-md-on-surface-variant mt-2">The password reset link is invalid or missing the token.</p>
          </CardHeader>
          <CardContent>
            <Button variant="tonal" asChild>
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-md-surface p-4 overflow-hidden">
      {/* Decorative Blur Shapes */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-md-primary/10 rounded-full blur-3xl mix-blend-multiply pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[400px] h-[400px] bg-md-tertiary/10 rounded-[80px] blur-3xl mix-blend-multiply pointer-events-none" aria-hidden="true" />

      <Card className="max-w-md w-full relative z-10 shadow-sm border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl text-md-primary mb-2">Set New Password</CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-2xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="bg-green-50 text-green-700 p-3 rounded-2xl mb-6 text-sm">
                Your password has been successfully reset!
              </div>
              <p className="text-md-on-surface-variant text-sm mb-4">Redirecting to login...</p>
              <Button variant="ghost" asChild>
                <Link href="/login">Go to login now</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">New Password</label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col border-t border-md-outline/10 pt-6 mt-2">
          <p className="text-center text-sm text-md-on-surface-variant">
            <Button variant="ghost" size="sm" asChild className="px-1 h-auto">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
