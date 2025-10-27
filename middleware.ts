import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Regex to check whether something has an extension, e.g. .jpg
const PUBLIC_FILE = /\.(.*)$/

export function middleware(request: NextRequest) {
  const { nextUrl, headers } = request

  const url = nextUrl.clone()

  try {
    // ===== AUTHENTICATION CHECK =====
    // Check if site password protection is enabled
    const isPasswordProtected = process.env.SITE_PASSWORD_ENABLED === 'true'

    if (isPasswordProtected) {
      // Check for login page (no language prefix since we skip language routing for /login)
      const isLoginPage = nextUrl.pathname === '/login'
      const isAuthApi = nextUrl.pathname.startsWith('/api/auth')
      const isPublicFile = PUBLIC_FILE.test(nextUrl.pathname)
      const isNextInternal = nextUrl.pathname.startsWith('/_next')

      // Check if user is authenticated
      const authCookie = request.cookies.get('site-auth')
      const isAuthenticated = authCookie?.value === 'authenticated'

      // Allow access to login page, auth API, and public files
      if (!isAuthenticated && !isLoginPage && !isAuthApi && !isPublicFile && !isNextInternal) {
        // Redirect to login page
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
      }

      // Redirect authenticated users away from login page
      if (isAuthenticated && isLoginPage) {
        const homeUrl = new URL('/', request.url)
        return NextResponse.redirect(homeUrl)
      }
    }

    // Allow normal routing for all other requests
    return undefined
  } catch (error) {
    console.log(error)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
