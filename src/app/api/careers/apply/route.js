import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const applicationSchema = z.object({
    jobPostingId: z.number().int().positive(),
    candidateName: z.string().min(2),
    candidateEmail: z.string().email(),
    candidatePhone: z.string().optional(),
    resumeUrl: z.string().url().optional(),
    coverLetterUrl: z.string().url().optional(),
    source: z.enum(['WEBSITE', 'LINKEDIN', 'REFERRAL', 'NAUKRI', 'INDEED', 'OTHER']).default('WEBSITE')
})

export async function POST(request) {
    try {
        const body = await request.json()
        const validatedData = applicationSchema.parse(body)

        // Verify job exists and is open
        const job = await prisma.jobPosting.findUnique({
            where: { id: validatedData.jobPostingId }
        })

        if (!job || job.status !== 'OPEN') {
            return NextResponse.json(
                { error: 'Job is no longer accepting applications' },
                { status: 400 }
            )
        }

        // Check for duplicate application (same email, same job)
        const existingApp = await prisma.application.findFirst({
            where: {
                jobPostingId: validatedData.jobPostingId,
                candidateEmail: validatedData.candidateEmail
            }
        })

        if (existingApp) {
            return NextResponse.json(
                { error: 'You have already applied for this position' },
                { status: 400 }
            )
        }

        const application = await prisma.application.create({
            data: {
                ...validatedData,
                status: 'NEW',
                stage: 'Applied'
            }
        })

        return NextResponse.json({ success: true, applicationId: application.id })
    } catch (error) {
        console.error('Error submitting application:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid application data', details: error.errors },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to submit application' },
            { status: 500 }
        )
    }
}
