import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken, generateCSRFToken } from '@/lib/auth'
import { isAccountLocked, calculateLockoutDuration, checkRateLimit, getClientIP, getUserAgent } from '@/lib/security'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'

// Parse user agent string into device info
function parseUserAgent(ua) {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', deviceType: 'desktop', deviceName: 'Unknown Device' }

    let browser = 'Unknown'
    let os = 'Unknown'
    let deviceType = 'desktop'

    if (ua.includes('Edg/')) browser = 'Microsoft Edge'
    else if (ua.includes('Chrome/')) browser = 'Google Chrome'
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox'
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera'

    if (ua.includes('Windows NT 10')) os = 'Windows 10/11'
    else if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac OS X')) os = 'macOS'
    else if (ua.includes('Android')) { os = 'Android'; deviceType = 'mobile' }
    else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; deviceType = ua.includes('iPad') ? 'tablet' : 'mobile' }
    else if (ua.includes('Linux')) os = 'Linux'

    const deviceName = `${browser} on ${os}`
    return { browser, os, deviceType, deviceName }
}

export async function POST(request) {
    try {
        const { loginId, password } = await request.json()
        
        // Rate limiting - 10 login attempts per minute per IP
        const clientIP = getClientIP(request)
        const rateLimit = checkRateLimit(`login-${clientIP}`, 10, 60 * 1000)
        
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: `Too many login attempts. Try again in ${rateLimit.resetIn} seconds` }, 
                { status: 429 }
            )
        }

        // LoginID can be email OR employeeId
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: loginId },
                    { employeeId: loginId }
                ]
            },
            include: {
                details: true
            }
        })

        if (!user) {
            await createAuditLog({
                userId: null,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: null,
                details: `Failed login attempt for: ${loginId}`,
                request
            })
            
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        if (!user.isActive) {
            await createAuditLog({
                userId: user.id,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: 'Login attempt on inactive account',
                request
            })
            
            return NextResponse.json({ error: 'Account is inactive. Please contact HR' }, { status: 403 })
        }
        
        // Check if email is verified
        if (!user.emailVerified) {
            await createAuditLog({
                userId: user.id,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: 'Login attempt with unverified email',
                request
            })
            
            return NextResponse.json({ 
                error: 'Email not verified', 
                code: 'EMAIL_NOT_VERIFIED',
                email: user.email 
            }, { status: 403 })
        }
        
        // Check if account is locked
        if (isAccountLocked(user)) {
            const lockExpiry = new Date(user.accountLockedUntil)
            const minutesRemaining = Math.ceil((lockExpiry - new Date()) / 60000)
            
            await createAuditLog({
                userId: user.id,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: 'Login attempt on locked account',
                request
            })
            
            return NextResponse.json(
                { error: `Account is locked. Try again in ${minutesRemaining} minutes` }, 
                { status: 403 }
            )
        }

        const isValid = await bcrypt.compare(password, user.password)
        
        if (!isValid) {
            const newFailedAttempts = user.failedLoginAttempts + 1
            const lockoutMinutes = calculateLockoutDuration(newFailedAttempts)
            
            const updateData = {
                failedLoginAttempts: newFailedAttempts
            }
            
            if (lockoutMinutes > 0) {
                updateData.accountLockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000)
            }
            
            await prisma.user.update({
                where: { id: user.id },
                data: updateData
            })
            
            await createAuditLog({
                userId: user.id,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: `Invalid password. Failed attempts: ${newFailedAttempts}`,
                request
            })
            
            if (lockoutMinutes > 0) {
                await createAuditLog({
                    userId: user.id,
                    action: AuditActions.ACCOUNT_LOCKED,
                    resource: AuditResources.AUTHENTICATION,
                    resourceId: user.id.toString(),
                    details: `Account locked for ${lockoutMinutes} minutes after ${newFailedAttempts} failed attempts`,
                    request
                })
                
                return NextResponse.json(
                    { error: `Account locked for ${lockoutMinutes} minutes due to multiple failed attempts` }, 
                    { status: 403 }
                )
            }
            
            const remainingAttempts = 5 - newFailedAttempts
            return NextResponse.json(
                { error: `Invalid credentials. ${remainingAttempts} attempts remaining before lockout` }, 
                { status: 401 }
            )
        }
        
        // Password is valid — check if 2FA is enabled
        if (user.twoFactorEnabled) {
            // Don't issue token yet — return that 2FA is required
            return NextResponse.json({
                requiresTwoFactor: true,
                userId: user.id,
                message: 'Please enter your 2FA verification code.'
            })
        }

        // No 2FA — proceed with normal login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                accountLockedUntil: null,
                lastLoginAt: new Date()
            }
        })

        // Check password expiry (90 days rotation policy)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        
        const needsPasswordReset = user.firstLogin || 
                                   !user.passwordChangedAt || 
                                   user.passwordChangedAt < ninetyDaysAgo

        // Generate JWT
        const token = await signToken({
            id: user.id,
            role: user.role,
            firstLogin: user.firstLogin,
            needsPasswordReset
        })
        
        // Generate CSRF token
        const csrfToken = generateCSRFToken(user.id.toString())

        // Create tracked session
        const ua = getUserAgent(request)
        const deviceInfo = parseUserAgent(ua)

        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                ipAddress: clientIP,
                userAgent: ua,
                deviceName: deviceInfo.deviceName,
                deviceType: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        })
        
        // Audit log
        await createAuditLog({
            userId: user.id,
            action: AuditActions.LOGIN_SUCCESS,
            resource: AuditResources.AUTHENTICATION,
            resourceId: user.id.toString(),
            details: `Successful login from ${deviceInfo.deviceName}`,
            request
        })

        const response = NextResponse.json({
            success: true,
            csrfToken,
            user: {
                id: user.id,
                role: user.role,
                firstLogin: user.firstLogin,
                emailVerified: user.emailVerified,
                name: user.details?.firstName || 'User'
            }
        })

        // Set HTTP-only cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24,
            path: '/',
        })

        // Set CSRF token as a cookie (double-submit pattern)
        response.cookies.set('csrf-token', csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24,
            path: '/',
        })

        return response

    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
