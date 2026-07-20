import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request, { params }) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { jobId } = params

        const applications = await prisma.application.findMany({
            where: {
                jobPostingId: parseInt(jobId)
            },
            include: {
                interviews: true
            },
            orderBy: {
                appliedAt: 'desc'
            }
        })

        const job = await prisma.jobPosting.findUnique({
            where: { id: parseInt(jobId) }
        })

        return NextResponse.json({ success: true, applications, job })
    } catch (error) {
        console.error('Error fetching applications:', error)
        return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }
}
