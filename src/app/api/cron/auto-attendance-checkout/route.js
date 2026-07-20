import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'

/**
 * Automatic attendance checkout
 * Runs once per day and closes any open attendance records at 7:00 PM IST
 */
export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET || 'dayflow-cron-secret-2026'

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const today = new Date(`${year}-${month}-${day}T00:00:00.000Z`)

        const autoCheckoutTime = new Date(`${year}-${month}-${day}T13:30:00.000Z`)

        const openAttendanceRecords = await prisma.attendance.findMany({
            where: {
                date: today,
                checkIn: { not: null },
                checkOut: null,
                status: { in: ['PRESENT', 'HALF_DAY'] }
            }
        })

        if (openAttendanceRecords.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No open attendance records found',
                updated: 0
            })
        }

        for (const record of openAttendanceRecords) {
            await prisma.attendance.update({
                where: { id: record.id },
                data: {
                    checkOut: autoCheckoutTime
                }
            })

            await createAuditLog({
                userId: record.userId,
                action: AuditActions.ATTENDANCE_CHECKOUT,
                resource: AuditResources.ATTENDANCE,
                resourceId: record.id.toString(),
                details: 'Auto check-out applied at 7:00 PM for missing checkout',
                request
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Auto check-out completed successfully',
            updated: openAttendanceRecords.length
        })
    } catch (error) {
        console.error('Auto Attendance Checkout Error:', error)
        return NextResponse.json({
            error: 'Failed to run auto attendance checkout',
            details: error.message
        }, { status: 500 })
    }
}