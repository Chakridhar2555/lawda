import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('user')
  const isAuthPage = request.nextUrl.pathname === '/login'
  const isUserPath = request.nextUrl.pathname.startsWith('/user/')
  const isAdminPath = request.nextUrl.pathname.startsWith('/dashboard') || 
                     request.nextUrl.pathname.startsWith('/users') ||
                     request.nextUrl.pathname.startsWith('/settings') ||
                     request.nextUrl.pathname.startsWith('/lead') ||
                     request.nextUrl.pathname.startsWith('/calendar') ||
                     request.nextUrl.pathname.startsWith('/inventory')

  // Debug logs
  console.log('Current path:', request.nextUrl.pathname)
  console.log('User cookie:', userCookie)
  console.log('Is auth page:', isAuthPage)
  console.log('Is user path:', isUserPath)
  console.log('Is admin path:', isAdminPath)

  if (!userCookie && !isAuthPage) {
    console.log('Redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (userCookie) {
    const user = JSON.parse(userCookie.value)
    const isAdmin = user.role === "Administrator"

    if (isAuthPage) {
      // Redirect logged-in users away from login page
      console.log('Redirecting from login to appropriate dashboard')
      return NextResponse.redirect(
        new URL(isAdmin ? '/dashboard' : '/user/dashboard', request.url)
      )
    }

    // Prevent non-admins from accessing admin paths
    if (!isAdmin && isAdminPath) {
      console.log('Non-admin attempting to access admin path')
      return NextResponse.redirect(new URL('/user/dashboard', request.url))
    }

    // Prevent admins from accessing user paths
    if (isAdmin && isUserPath) {
      console.log('Admin attempting to access user path')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/lead/:path*',
    '/calendar/:path*',
    '/settings/:path*',
    '/inventory/:path*',
    '/user/:path*',
    '/login'
  ],
} 