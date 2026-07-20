import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'

// Helper to check password strength
function validatePasswordStrength(password) {
    if (password.length < 8) return "Password must be at least 8 characters long."
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter."
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter."
    if (!/[0-9]/.test(password)) return "Password must contain at least one number."
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character."
    return null // Valid
}

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

        const { currentPassword, newPassword } = await request.json()
        
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            include: { passwordHistory: { orderBy: { createdAt: 'desc' }, take: 5 } }
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // Verify current password
        const isCurrentValid = await bcrypt.compare(currentPassword, user.password)
        if (!isCurrentValid) {
            await createAuditLog({
                userId: user.id,
                action: 'PASSWORD_CHANGE_FAILED',
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: 'Invalid current password provided during password change attempt',
                request
            })
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }

        // Validate password strength
        const strengthError = validatePasswordStrength(newPassword)
        if (strengthError) {
            return NextResponse.json({ error: strengthError }, { status: 400 })
        }

        // Check if new password matches current password
        const isSameAsCurrent = await bcrypt.compare(newPassword, user.password)
        if (isSameAsCurrent) {
            return NextResponse.json({ error: 'New password cannot be the same as the current password' }, { status: 400 })
        }

        // Check password history (cannot reuse last 5 passwords)
        for (const history of user.passwordHistory) {
            const matchesHistory = await bcrypt.compare(newPassword, history.hash)
            if (matchesHistory) {
                return NextResponse.json({ error: 'You cannot reuse any of your last 5 passwords for security reasons.' }, { status: 400 })
            }
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)

        // Update password and record history
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    passwordChangedAt: new Date(),
                    firstLogin: false // Clear first login flag if set
                }
            }),
            prisma.passwordHistory.create({
                data: {
                    userId: user.id,
                    hash: hashedPassword
                }
            })
        ])

        // Revoke all other sessions (security best practice after password change)
        await prisma.session.updateMany({
            where: {
                userId: user.id,
                token: { not: token },
                isRevoked: false
            },
            data: { isRevoked: true }
        })

        await createAuditLog({
            userId: user.id,
            action: 'PASSWORD_CHANGED',
            resource: AuditResources.AUTHENTICATION,
            resourceId: user.id.toString(),
            details: 'Password was changed successfully and other active sessions were revoked.',
            request
        })

        // We should issue a new token with needsPasswordReset = false
        const newToken = await signToken({
            id: user.id,
            role: user.role,
            firstLogin: false,
            needsPasswordReset: false
        })

        const response = NextResponse.json({ 
            success: true, 
            message: 'Password changed successfully. All other devices have been logged out.' 
        })
        
        response.cookies.set('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24,
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Password change error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
