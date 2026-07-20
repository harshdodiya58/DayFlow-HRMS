import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PATCH(request, { params }) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = params
        const body = await request.json()
        const { status, exitInterviewCompleted, clearanceCompleted } = body

        const offboarding = await prisma.offboardingProcess.update({
            where: { id: parseInt(id) },
            data: {
                ...(status && { status }),
                ...(exitInterviewCompleted !== undefined && { exitInterviewCompleted }),
                ...(clearanceCompleted !== undefined && { clearanceCompleted })
            }
        })

        // If completed, set user to inactive
        if (status === 'COMPLETED') {
            await prisma.user.update({
                where: { id: offboarding.employeeId },
                data: { status: 'INACTIVE' }
            })
        }

        return NextResponse.json({ success: true, offboarding })
    } catch (error) {
        console.error('Error updating offboarding:', error)
        return NextResponse.json({ error: 'Failed to update offboarding status' }, { status: 500 })
    }
}
