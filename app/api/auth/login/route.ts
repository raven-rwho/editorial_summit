import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface RequestBody {
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()

    // Get the site password from environment variable
    const sitePassword = process.env.SITE_PASSWORD

    if (!sitePassword) {
      return NextResponse.json(
        { error: 'Site password not configured' },
        { status: 500 }
      )
    }

    // Check if provided password matches
    if (body.password === sitePassword) {
      // Set a secure session cookie
      const cookieStore = await cookies()
      cookieStore.set('site-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
