'use client'

import { useState } from 'react'
import { getSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getDashboardPath } from '@/lib/dashboard'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    let keepLoadingDuringRedirect = false

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        setError('Invalid email or password')
        return
      }

      const session = await getSession()
      keepLoadingDuringRedirect = true
      router.push(getDashboardPath(session?.user?.role))
      router.refresh()
    } catch {
      setError('Unable to sign in right now. Please try again.')
    } finally {
      if (!keepLoadingDuringRedirect) {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-md-surface p-4 overflow-hidden">
      {/* Decorative Blur Shapes (Material You Bold Factor) */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-md-tertiary/10 rounded-[100px] blur-3xl mix-blend-multiply pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-md-primary/10 rounded-full blur-3xl mix-blend-multiply pointer-events-none" aria-hidden="true" />

      <Card className="max-w-md w-full relative z-10 shadow-sm border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl text-md-primary mb-2">Sign in</CardTitle>
          <p className="text-md-on-surface-variant">Welcome back to UniBridge</p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}

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

            <div>
              <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>

            <div className="flex items-center justify-end">
              <Button variant="ghost" size="sm" asChild className="px-2">
                <Link href="/forgot-password">
                  Forgot password?
                </Link>
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t border-md-outline/10 pt-6 mt-2">
          <p className="text-center text-sm text-md-on-surface-variant mb-4">
            Don&apos;t have an account? Choose how you want to register:
            Student or College.
          </p>
          <div className="flex gap-4 w-full mb-4">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/register/student">
                Student
              </Link>
            </Button>
            <Button variant="tonal" asChild className="flex-1">
              <Link href="/register/college">
                College
              </Link>
            </Button>
          </div>
          <p className="text-center text-xs text-md-on-surface-variant mt-2">
            Administrators: Please sign in with your staff credentials.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
