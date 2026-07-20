import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
    try {
        const { jobId } = params

        const job = await prisma.jobPosting.findUnique({
            where: {
                id: parseInt(jobId),
                status: 'OPEN'
            },
            include: {
                department: {
                    select: {
                        name: true
                    }
                }
            }
        })

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found or no longer available' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, job })
    } catch (error) {
        console.error('Error fetching job:', error)
        return NextResponse.json(
            { error: 'Failed to fetch job details' },
            { status: 500 }
        )
    }
}
