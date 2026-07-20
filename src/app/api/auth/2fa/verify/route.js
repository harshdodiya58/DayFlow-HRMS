import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signToken, generateCSRFToken } from '@/lib/auth'
import { verifyTOTP } from '../setup/route'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'
import { getClientIP, getUserAgent } from '@/lib/security'

// POST /api/auth/2fa/verify — Verify 2FA code during login
export async function POST(request) {
    try {
        const { userId, code } = await request.json()

        if (!userId || !code) {
            return NextResponse.json({ error: 'User ID and code are required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { details: true }
        })

        if (!user || !user.twoFactorEnabled) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const storedData = JSON.parse(user.twoFactorSecret || '{}')

        // Check TOTP code
        let isValid = verifyTOTP(storedData.secret, code)

        // Check backup codes
        if (!isValid && storedData.backupCodes?.includes(code)) {
            isValid = true
            // Remove used backup code
            const updatedCodes = storedData.backupCodes.filter(c => c !== code)
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    twoFactorSecret: JSON.stringify({
                        ...storedData,
                        backupCodes: updatedCodes
                    })
                }
            })
        }

        if (!isValid) {
            await createAuditLog({
                userId: user.id,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: 'Failed 2FA verification attempt',
                request
            })

            return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 })
        }

        // Check password expiry (90 days rotation policy)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        
        const needsPasswordReset = user.firstLogin || 
                                   !user.passwordChangedAt || 
                                   user.passwordChangedAt < ninetyDaysAgo

        // 2FA verified! Issue JWT and create session
        const token = await signToken({
            id: user.id,
            role: user.role,
            firstLogin: user.firstLogin,
            needsPasswordReset
        })

        const csrfToken = generateCSRFToken(user.id.toString())

        // Parse user agent for session
        const userAgent = getUserAgent(request)
        const clientIP = getClientIP(request)

        // Create session record
        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                ipAddress: clientIP,
                userAgent,
                deviceName: `2FA Login`,
                deviceType: 'desktop',
                browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Other',
                os: userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : 'Other',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        })

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                accountLockedUntil: null,
                lastLoginAt: new Date()
            }
        })

        await createAuditLog({
            userId: user.id,
            action: AuditActions.LOGIN_SUCCESS,
            resource: AuditResources.AUTHENTICATION,
            resourceId: user.id.toString(),
            details: 'Successful login with 2FA',
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

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24,
            path: '/',
        })

        response.cookies.set('csrf-token', csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24,
            path: '/',
        })

        return response
    } catch (e) {
        console.error('2FA verify error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
