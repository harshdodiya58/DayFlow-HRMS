import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'

// Parse user agent string into device info
function parseUserAgent(ua) {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', deviceType: 'desktop', deviceName: 'Unknown Device' }

    let browser = 'Unknown'
    let os = 'Unknown'
    let deviceType = 'desktop'

    // Detect browser
    if (ua.includes('Edg/')) browser = 'Microsoft Edge'
    else if (ua.includes('Chrome/')) browser = 'Google Chrome'
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox'
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera'

    // Detect OS
    if (ua.includes('Windows NT 10')) os = 'Windows 10/11'
    else if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac OS X')) os = 'macOS'
    else if (ua.includes('Android')) { os = 'Android'; deviceType = 'mobile' }
    else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; deviceType = ua.includes('iPad') ? 'tablet' : 'mobile' }
    else if (ua.includes('Linux')) os = 'Linux'

    const deviceName = `${browser} on ${os}`

    return { browser, os, deviceType, deviceName }
}

// GET /api/auth/sessions — List all active sessions for the current user
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

        const sessions = await prisma.session.findMany({
            where: {
                userId: payload.id,
                isRevoked: false,
                expiresAt: { gt: new Date() }
            },
            orderBy: { lastActiveAt: 'desc' },
            select: {
                id: true,
                ipAddress: true,
                deviceName: true,
                deviceType: true,
                browser: true,
                os: true,
                lastActiveAt: true,
                createdAt: true,
                token: true
            }
        })

        // Mark the current session
        const currentToken = token
        const sessionsWithCurrent = sessions.map(s => ({
            ...s,
            isCurrent: s.token === currentToken,
            token: undefined // Don't expose tokens to client
        }))

        return NextResponse.json({ sessions: sessionsWithCurrent })
    } catch (e) {
        console.error('Sessions fetch error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/auth/sessions — Revoke a session (or all other sessions)
export async function DELETE(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')
        const revokeAll = searchParams.get('all') === 'true'

        if (revokeAll) {
            // Revoke all sessions except the current one
            await prisma.session.updateMany({
                where: {
                    userId: payload.id,
                    token: { not: token },
                    isRevoked: false
                },
                data: { isRevoked: true }
            })

            await createAuditLog({
                userId: payload.id,
                action: AuditActions.LOGOUT,
                resource: AuditResources.AUTHENTICATION,
                resourceId: payload.id.toString(),
                details: 'Revoked all other sessions',
                request
            })

            return NextResponse.json({ success: true, message: 'All other sessions have been revoked' })
        }

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }

        // Revoke a specific session
        const session = await prisma.session.findFirst({
            where: {
                id: parseInt(sessionId),
                userId: payload.id,
                isRevoked: false
            }
        })

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Don't allow revoking current session from here (use /logout for that)
        if (session.token === token) {
            return NextResponse.json({ error: 'Cannot revoke current session. Use logout instead.' }, { status: 400 })
        }

        await prisma.session.update({
            where: { id: session.id },
            data: { isRevoked: true }
        })

        await createAuditLog({
            userId: payload.id,
            action: AuditActions.LOGOUT,
            resource: AuditResources.AUTHENTICATION,
            resourceId: session.id.toString(),
            details: `Revoked session from ${session.deviceName || 'unknown device'}`,
            request
        })

        return NextResponse.json({ success: true, message: 'Session revoked successfully' })
    } catch (e) {
        console.error('Session revoke error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Export parseUserAgent for use in login route
export { parseUserAgent }
