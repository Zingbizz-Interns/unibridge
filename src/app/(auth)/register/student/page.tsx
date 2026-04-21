'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function StudentRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Auto sign in
      const signInRes = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      })

      if (signInRes?.error) {
        router.push('/login')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-md-surface p-4 overflow-hidden">
      {/* Decorative Blur Shapes */}
      <div className="absolute top-0 left-0 -translate-y-1/3 -translate-x-1/4 w-[500px] h-[500px] bg-md-primary/10 rounded-full blur-3xl mix-blend-multiply pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-md-tertiary/10 rounded-[100px] blur-3xl mix-blend-multiply pointer-events-none" aria-hidden="true" />

      <Card className="max-w-md w-full relative z-10 shadow-sm border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl text-md-primary mb-2">Create Account</CardTitle>
          <p className="text-md-on-surface-variant">Join UniBridge as a student</p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-2xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">Full Name</label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">Email</label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">Phone (10 digits)</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="9876543210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-md-on-surface mb-1 ml-1">Password</label>
              <Input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Min. 8 characters"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t border-md-outline/10 pt-6 mt-2">
          <p className="text-center text-sm text-md-on-surface-variant">
            Already have an account?{' '}
            <Button variant="ghost" size="sm" asChild className="px-1 h-auto">
              <Link href="/login">Sign in</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
