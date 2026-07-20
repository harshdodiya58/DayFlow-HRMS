import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'

// GET /api/admin/compliance/data-export?employeeId=123
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const employeeId = searchParams.get('employeeId')

        if (!employeeId) {
            return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
        }

        // Fetch comprehensive data for the employee (GDPR / DPDP Right to Data Portability)
        const user = await prisma.user.findUnique({
            where: { id: parseInt(employeeId) },
            include: {
                details: true,
                attendance: { orderBy: { date: 'desc' } },
                leaves: { orderBy: { createdAt: 'desc' } },
                leaveBalances: true,
                payrolls: { orderBy: { payPeriod: 'desc' } },
                salary: true,
                documents: { select: { id: true, title: true, type: true, uploadedAt: true } },
                auditLogs: { orderBy: { createdAt: 'desc' }, take: 100 },
                sessions: { select: { id: true, deviceName: true, ipAddress: true, lastActiveAt: true } }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Remove sensitive fields like password hash, 2FA secrets
        user.password = undefined
        user.twoFactorSecret = undefined
        user.passwordResetToken = undefined
        
        await createAuditLog({
            userId: payload.id,
            action: AuditActions.DATA_EXPORTED,
            resource: AuditResources.USER,
            resourceId: user.id.toString(),
            details: `Exported all data for employee ${user.employeeId}`,
            request
        })

        // Return JSON format (can be converted to CSV on frontend if needed)
        return NextResponse.json({
            success: true,
            exportDate: new Date().toISOString(),
            data: user
        })
    } catch (e) {
        console.error('Data export error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
