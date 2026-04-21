import { auth } from './auth'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth(allowedRoles?: ('student' | 'college' | 'admin')[]) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect('/')
  }

  return user
}
