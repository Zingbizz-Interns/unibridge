import { auth } from '@/lib/auth'
import { getDashboardPath } from '@/lib/dashboard'
import { NextResponse } from 'next/server'

const protectedRoutes = {
  student: ['/dashboard', '/apply'],
  college: ['/college'],
  admin: ['/admin'],
}

const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function matchesAnyRoute(pathname: string, routes: readonly string[]) {
  return routes.some((route) => matchesRoute(pathname, route))
}

export const proxy = auth((req) => {
  const { nextUrl } = req
  const pathname = nextUrl.pathname
  const isLoggedIn = Boolean(req.auth)
  const userRole = req.auth?.user?.role

  if (isLoggedIn && matchesAnyRoute(pathname, authRoutes)) {
    return NextResponse.redirect(new URL(getDashboardPath(userRole), nextUrl))
  }

  const isStudentRoute = matchesAnyRoute(pathname, protectedRoutes.student)
  const isCollegeRoute = matchesAnyRoute(pathname, protectedRoutes.college)
  const isAdminRoute = matchesAnyRoute(pathname, protectedRoutes.admin)

  if (isStudentRoute || isCollegeRoute || isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }

    if (isStudentRoute && userRole !== 'student') {
      return NextResponse.redirect(new URL(getDashboardPath(userRole), nextUrl))
    }

    if (isCollegeRoute && userRole !== 'college' && userRole !== 'admin') {
      return NextResponse.redirect(new URL(getDashboardPath(userRole), nextUrl))
    }

    if (isAdminRoute && userRole !== 'admin') {
      return NextResponse.redirect(new URL(getDashboardPath(userRole), nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
