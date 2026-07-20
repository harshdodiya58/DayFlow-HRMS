import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'
import crypto from 'crypto'

// Simple TOTP implementation
function generateTOTPSecret() {
    const buffer = crypto.randomBytes(20)
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < buffer.length; i++) {
        secret += base32chars[buffer[i] % 32]
    }
    return secret
}

function generateBackupCodes() {
    const codes = []
    for (let i = 0; i < 10; i++) {
        codes.push(crypto.randomInt(10000000, 99999999).toString())
    }
    return codes
}

function base32ToBuffer(base32) {
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let bits = ''
    for (const char of base32.toUpperCase()) {
        const val = base32chars.indexOf(char)
        if (val === -1) continue
        bits += val.toString(2).padStart(5, '0')
    }
    const bytes = []
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substr(i, 8), 2))
    }
    return Buffer.from(bytes)
}

function generateTOTP(secret, timeStep = 30) {
    const time = Math.floor(Date.now() / 1000 / timeStep)
    const timeBuffer = Buffer.alloc(8)
    timeBuffer.writeUInt32BE(0, 0)
    timeBuffer.writeUInt32BE(time, 4)

    const key = base32ToBuffer(secret)
    const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest()

    const offset = hmac[hmac.length - 1] & 0x0f
    const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
    ) % 1000000

    return code.toString().padStart(6, '0')
}

export function verifyTOTP(secret, code) {
    // Check current and adjacent time windows (±1 step for clock drift)
    for (let i = -1; i <= 1; i++) {
        const time = Math.floor(Date.now() / 1000 / 30) + i
        const timeBuffer = Buffer.alloc(8)
        timeBuffer.writeUInt32BE(0, 0)
        timeBuffer.writeUInt32BE(time, 4)

        const key = base32ToBuffer(secret)
        const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest()

        const offset = hmac[hmac.length - 1] & 0x0f
        const generated = (
            ((hmac[offset] & 0x7f) << 24) |
            ((hmac[offset + 1] & 0xff) << 16) |
            ((hmac[offset + 2] & 0xff) << 8) |
            (hmac[offset + 3] & 0xff)
        ) % 1000000

        if (generated.toString().padStart(6, '0') === code) {
            return true
        }
    }
    return false
}

// POST /api/auth/2fa/setup — Generate secret and return QR URL
export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

        const { action, code } = await request.json()

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, email: true, twoFactorEnabled: true, twoFactorSecret: true }
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        if (action === 'generate') {
            // Generate a new TOTP secret
            const secret = generateTOTPSecret()
            const backupCodes = generateBackupCodes()

            // Store secret temporarily (not yet activated)
            await prisma.user.update({
                where: { id: user.id },
                data: { twoFactorSecret: JSON.stringify({ secret, backupCodes, pending: true }) }
            })

            // Generate otpauth URL for authenticator apps
            const otpauthUrl = `otpauth://totp/DayFlow:${user.email}?secret=${secret}&issuer=DayFlow&digits=6&period=30`

            return NextResponse.json({
                secret,
                otpauthUrl,
                backupCodes,
                message: 'Scan the QR code in your authenticator app, then verify with a code.'
            })
        }

        if (action === 'activate') {
            // Verify the code and activate 2FA
            if (!code) return NextResponse.json({ error: 'Verification code required' }, { status: 400 })

            const storedData = JSON.parse(user.twoFactorSecret || '{}')
            if (!storedData.secret || !storedData.pending) {
                return NextResponse.json({ error: 'Please generate a 2FA secret first' }, { status: 400 })
            }

            const isValid = verifyTOTP(storedData.secret, code)
            if (!isValid) {
                return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 })
            }

            // Activate 2FA
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    twoFactorEnabled: true,
                    twoFactorSecret: JSON.stringify({
                        secret: storedData.secret,
                        backupCodes: storedData.backupCodes,
                        pending: false
                    })
                }
            })

            await createAuditLog({
                userId: user.id,
                action: AuditActions.TWO_FACTOR_ENABLED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: 'Two-factor authentication enabled',
                request
            })

            return NextResponse.json({ success: true, message: '2FA has been activated successfully!' })
        }

        if (action === 'disable') {
            // Disable 2FA (require current code)
            if (!code) return NextResponse.json({ error: 'Current 2FA code required to disable' }, { status: 400 })

            if (!user.twoFactorEnabled) {
                return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 })
            }

            const storedData = JSON.parse(user.twoFactorSecret || '{}')
            const isValid = verifyTOTP(storedData.secret, code)

            // Also check backup codes
            const isBackupCode = storedData.backupCodes?.includes(code)

            if (!isValid && !isBackupCode) {
                return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null
                }
            })

            await createAuditLog({
                userId: user.id,
                action: AuditActions.TWO_FACTOR_DISABLED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: 'Two-factor authentication disabled',
                request
            })

            return NextResponse.json({ success: true, message: '2FA has been disabled.' })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (e) {
        console.error('2FA setup error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
