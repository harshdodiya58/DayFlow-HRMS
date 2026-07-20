import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'

// DELETE /api/admin/compliance/data-deletion?employeeId=123
export async function DELETE(request) {
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

        const userId = parseInt(employeeId)
        
        // Ensure user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { details: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // DPDP/GDPR Erasure Request
        // We cannot delete the user entirely due to payroll and audit constraints.
        // Instead, we anonymize PII (Personally Identifiable Information).

        await prisma.$transaction([
            // 1. Anonymize Employee Details
            prisma.employeeDetails.update({
                where: { userId },
                data: {
                    firstName: 'Anonymized',
                    lastName: 'User',
                    phone: null,
                    address: null,
                    emergencyContact: null,
                    emergencyPhone: null,
                    bloodGroup: null,
                    panNumber: null,
                    aadharNumber: null,
                    uanNumber: null,
                    bankAccount: null,
                    bankIfsc: null,
                    profileImage: null,
                }
            }),

            // 2. Anonymize User Auth Data
            prisma.user.update({
                where: { id: userId },
                data: {
                    email: `deleted_${userId}@anonymized.local`,
                    password: 'DELETED', // Render unusable
                    isActive: false,
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                    employeeId: `DEL-${userId}`,
                }
            }),

            // 3. Delete non-essential active sessions
            prisma.session.deleteMany({
                where: { userId }
            }),

            // 4. Delete unneeded documents (but keep legal contracts like Offer Letter if required by law)
            // For now, delete all
            prisma.document.deleteMany({
                where: { userId }
            })
        ])

        await createAuditLog({
            userId: payload.id,
            action: 'DATA_ANONYMIZED',
            resource: AuditResources.USER,
            resourceId: user.id.toString(),
            details: `Anonymized PII for employee ${user.employeeId} (Right to Erasure)`,
            request
        })

        return NextResponse.json({
            success: true,
            message: 'Employee data has been successfully anonymized in compliance with data protection laws.'
        })

    } catch (e) {
        console.error('Data deletion error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
