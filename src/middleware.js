import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_change_me')

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    '/login',
    '/auth',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/verify-email',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/setup',
    '/api/seed',
    '/careers',
    '/api/careers',
]

// Routes restricted to ADMIN role only
const ADMIN_ROUTES = [
    '/admin',
    '/api/admin',
]

// Static asset patterns to skip
const STATIC_PATTERNS = [
    '/_next',
    '/favicon.ico',
    '/uploads',
    '/readme',
]

function isPublicRoute(pathname) {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

function isAdminRoute(pathname) {
    return ADMIN_ROUTES.some(route => pathname.startsWith(route))
}

function isStaticAsset(pathname) {
    return STATIC_PATTERNS.some(pattern => pathname.startsWith(pattern))
}

// Security headers applied to every response
function addSecurityHeaders(response) {
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    return response
}

export async function middleware(request) {
    const { pathname } = request.nextUrl

    // Skip middleware for static files
    if (isStaticAsset(pathname)) {
        return NextResponse.next()
    }

    // Allow public routes without auth
    if (isPublicRoute(pathname)) {
        const response = NextResponse.next()
        return addSecurityHeaders(response)
    }

    // Landing page is public
    if (pathname === '/') {
        const response = NextResponse.next()
        return addSecurityHeaders(response)
    }

    // --- Authentication Check ---
    const token = request.cookies.get('token')?.value

    if (!token) {
        // API routes return 401, page routes redirect to login
        if (pathname.startsWith('/api/')) {
            const response = NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
            return addSecurityHeaders(response)
        }
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Verify JWT
    let payload
    try {
        const result = await jwtVerify(token, secretKey)
        payload = result.payload
    } catch (err) {
        // Token is invalid or expired
        if (pathname.startsWith('/api/')) {
            const response = NextResponse.json(
                { error: 'Session expired. Please login again.' },
                { status: 401 }
            )
            // Clear the bad token
            response.cookies.set('token', '', { maxAge: 0, path: '/' })
            return addSecurityHeaders(response)
        }
        const loginUrl = new URL('/login', request.url)
        const response = NextResponse.redirect(loginUrl)
        response.cookies.set('token', '', { maxAge: 0, path: '/' })
        return response
    }
    // --- Password Rotation Enforcement ---
    if (payload.needsPasswordReset && 
        !pathname.startsWith('/dashboard/settings/security') && 
        !pathname.startsWith('/api/auth/password/change') &&
        !pathname.startsWith('/api/auth/logout') &&
        !pathname.startsWith('/_next')
    ) {
        if (pathname.startsWith('/api/')) {
            const response = NextResponse.json(
                { error: 'Password expired. Please update your password.' },
                { status: 403 }
            )
            return addSecurityHeaders(response)
        }
        
        const redirectUrl = new URL('/dashboard/settings/security', request.url)
        redirectUrl.searchParams.set('reason', 'password-expired')
        return NextResponse.redirect(redirectUrl)
    }

    // --- Role-Based Access Control ---
    if (isAdminRoute(pathname) && payload.role !== 'ADMIN') {
        if (pathname.startsWith('/api/')) {
            const response = NextResponse.json(
                { error: 'Insufficient permissions. Admin access required.' },
                { status: 403 }
            )
            return addSecurityHeaders(response)
        }
        // Redirect non-admins to their dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // --- CSRF Protection for Mutating Requests ---
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
    if (pathname.startsWith('/api/') && mutatingMethods.includes(request.method)) {
        // Skip CSRF for login/register (they don't have a token yet)
        if (!isPublicRoute(pathname)) {
            const csrfHeader = request.headers.get('x-csrf-token')
            const csrfCookie = request.cookies.get('csrf-token')?.value

            if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
                const response = NextResponse.json(
                    { error: 'Invalid CSRF token. Please refresh the page.' },
                    { status: 403 }
                )
                return addSecurityHeaders(response)
            }
        }
    }

    // --- Inject user info into request headers for downstream API routes ---
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.id?.toString() || '')
    requestHeaders.set('x-user-role', payload.role || '')

    const response = NextResponse.next({
        request: {
            headers: requestHeaders
        }
    })

    return addSecurityHeaders(response)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (browser icon)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
