import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN' && payload.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const policies = await prisma.leavePolicy.findMany({
            orderBy: { leaveType: 'asc' }
        })
        
        return NextResponse.json({ success: true, policies })
    } catch (error) {
        console.error('Error fetching leave policies:', error)
        return NextResponse.json({ error: 'Failed to fetch leave policies' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { leaveType, annualEntitlement, accrualRatePerMonth, maxCarryForward, isEncashable, requiresApproval } = body

        if (!leaveType) {
            return NextResponse.json({ error: 'Leave type is required' }, { status: 400 })
        }

        // Upsert since leaveType is unique
        const policy = await prisma.leavePolicy.upsert({
            where: { leaveType },
            update: {
                annualEntitlement: parseInt(annualEntitlement),
                accrualRatePerMonth: parseFloat(accrualRatePerMonth),
                maxCarryForward: parseInt(maxCarryForward),
                isEncashable: Boolean(isEncashable),
                requiresApproval: Boolean(requiresApproval)
            },
            create: {
                leaveType,
                annualEntitlement: parseInt(annualEntitlement) || 12,
                accrualRatePerMonth: parseFloat(accrualRatePerMonth) || 1.0,
                maxCarryForward: parseInt(maxCarryForward) || 0,
                isEncashable: Boolean(isEncashable),
                requiresApproval: Boolean(requiresApproval)
            }
        })

        return NextResponse.json({ success: true, policy })
    } catch (error) {
        console.error('Error saving leave policy:', error)
        return NextResponse.json({ error: 'Failed to save leave policy' }, { status: 500 })
    }
}
