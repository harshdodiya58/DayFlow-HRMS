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

        const { appId } = params
        const body = await request.json()
        const { status, stage, rating, notes } = body

        const application = await prisma.application.update({
            where: { id: parseInt(appId) },
            data: {
                ...(status && { status }),
                ...(stage && { stage }),
                ...(rating !== undefined && { rating }),
                ...(notes !== undefined && { notes }),
            }
        })

        return NextResponse.json({ success: true, application })
    } catch (error) {
        console.error('Error updating application:', error)
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }
}
