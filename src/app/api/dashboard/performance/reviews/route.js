import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)

        const reviews = await prisma.performanceReview.findMany({
            where: { employeeId: payload.id },
            include: {
                manager: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        
        return NextResponse.json({ success: true, reviews })
    } catch (error) {
        console.error('Error fetching employee reviews:', error)
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)

        const body = await request.json()
        const { reviewId, selfRating, selfComments } = body

        if (!reviewId) {
            return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
        }

        const review = await prisma.performanceReview.findUnique({ where: { id: parseInt(reviewId) } })

        if (!review || review.employeeId !== payload.id) {
            return NextResponse.json({ error: 'Review not found or access denied' }, { status: 404 })
        }

        if (review.status !== 'SELF_ASSESSMENT_PENDING') {
            return NextResponse.json({ error: 'Self-assessment is no longer pending' }, { status: 400 })
        }

        const updatedReview = await prisma.performanceReview.update({
            where: { id: parseInt(reviewId) },
            data: {
                selfRating: parseInt(selfRating),
                selfComments,
                status: 'MANAGER_ASSESSMENT_PENDING'
            }
        })

        return NextResponse.json({ success: true, review: updatedReview })
    } catch (error) {
        console.error('Error updating review:', error)
        return NextResponse.json({ error: 'Failed to submit self-assessment' }, { status: 500 })
    }
}
