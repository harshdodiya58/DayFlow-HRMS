import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)

        const currentYear = new Date().getFullYear()

        let [leaves, balances, holidays] = await Promise.all([
            // Leave history
            prisma.leaveRequest.findMany({
                where: { userId: payload.id },
                orderBy: { appliedAt: 'desc' }
            }),
            // Leave balances for current year
            prisma.leaveBalance.findMany({
                where: { userId: payload.id, year: currentYear }
            }),
            // All holidays for this year
            prisma.holiday.findMany({
                where: { 
                    date: { gte: new Date(new Date().getFullYear(), 0, 1) } 
                },
                orderBy: { date: 'asc' }
            })
        ])

        // Auto-initialize leave balances if the employee has none for this year
        if (balances.length === 0) {
            const activePolicies = await prisma.leavePolicy.findMany({
                where: { isActive: true }
            })
            
            if (activePolicies.length > 0) {
                const newBalances = activePolicies.map(policy => ({
                    userId: payload.id,
                    leaveType: policy.leaveType,
                    year: currentYear,
                    entitled: policy.annualEntitlement,
                    used: 0,
                    pending: 0,
                    carryForward: 0
                }))
                
                await prisma.leaveBalance.createMany({
                    data: newBalances
                })
                
                // Fetch the newly created balances
                balances = await prisma.leaveBalance.findMany({
                    where: { userId: payload.id, year: currentYear }
                })
            }
        }

        return NextResponse.json({ leaves, balances, holidays })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const body = await request.json()
        const { type, startDate, endDate, reason } = body

        if (!type || !startDate || !endDate || !reason) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (end < start) {
            return NextResponse.json({ error: 'End date cannot be before start date' }, { status: 400 })
        }

        const leave = await prisma.leaveRequest.create({
            data: {
                userId: payload.id,
                type,
                startDate: start,
                endDate: end,
                reason
            }
        })
        
        // Audit log
        await createAuditLog({
            userId: payload.id,
            action: AuditActions.LEAVE_APPLIED,
            resource: AuditResources.LEAVE,
            resourceId: leave.id.toString(),
            details: `Applied for ${type} leave from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            request
        })

        return NextResponse.json({ success: true, leave })

    } catch (e) {
        console.error("Leave application error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
