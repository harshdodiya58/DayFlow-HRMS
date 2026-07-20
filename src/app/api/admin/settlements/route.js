import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const settlements = await prisma.settlement.findMany({
            include: {
                employee: { select: { firstName: true, lastName: true, email: true } },
                processor: { select: { firstName: true, lastName: true } }
            },
            orderBy: { id: 'desc' }
        })
        
        return NextResponse.json({ success: true, settlements })
    } catch (error) {
        console.error('Error fetching settlements:', error)
        return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 })
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
        const { employeeId, offboardingId, leaveEncashment, gratuity, bonus, noticePeriodDeduction, assetDamageDeduction, loanBalance } = body

        if (!employeeId || !offboardingId) {
            return NextResponse.json({ error: 'Employee and offboarding process ID are required' }, { status: 400 })
        }

        const lE = leaveEncashment ? parseFloat(leaveEncashment) : 0
        const grat = gratuity ? parseFloat(gratuity) : 0
        const bon = bonus ? parseFloat(bonus) : 0
        const npd = noticePeriodDeduction ? parseFloat(noticePeriodDeduction) : 0
        const add = assetDamageDeduction ? parseFloat(assetDamageDeduction) : 0
        const loan = loanBalance ? parseFloat(loanBalance) : 0

        const totalAmount = (lE + grat + bon) - (npd + add + loan)

        const settlement = await prisma.settlement.create({
            data: {
                employeeId: parseInt(employeeId),
                offboardingId: parseInt(offboardingId),
                leaveEncashment: lE,
                gratuity: grat,
                bonus: bon,
                noticePeriodDeduction: npd,
                assetDamageDeduction: add,
                loanBalance: loan,
                totalAmount,
                status: 'PROCESSED',
                processedBy: payload.id,
                processedAt: new Date()
            }
        })

        await prisma.offboardingProcess.update({
            where: { id: parseInt(offboardingId) },
            data: { finalSettlementStatus: true }
        })

        return NextResponse.json({ success: true, settlement })
    } catch (error) {
        console.error('Error processing settlement:', error)
        return NextResponse.json({ error: 'Failed to process settlement' }, { status: 500 })
    }
}
