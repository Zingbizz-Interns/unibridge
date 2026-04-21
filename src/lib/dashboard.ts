export type UserRole = 'student' | 'college' | 'admin'

const dashboardByRole: Record<UserRole, string> = {
  student: '/dashboard',
  college: '/college/dashboard',
  admin: '/admin/dashboard',
}

export function getDashboardPath(role?: UserRole | null) {
  if (!role) {
    return '/login'
  }

  return dashboardByRole[role]
}
