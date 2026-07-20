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

        const reviews = await prisma.performanceReview.findMany({
            include: {
                employee: { select: { firstName: true, lastName: true, email: true } },
                manager: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        
        return NextResponse.json({ success: true, reviews })
    } catch (error) {
        console.error('Error fetching reviews:', error)
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN' && payload.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { title, employeeId, dueDate } = body

        if (!title || !employeeId) {
            return NextResponse.json({ error: 'Title and Employee are required' }, { status: 400 })
        }

        // Find employee's manager
        const emp = await prisma.user.findUnique({
            where: { id: parseInt(employeeId) },
            select: { managerId: true }
        })

        if (!emp?.managerId) {
            return NextResponse.json({ error: 'Employee does not have an assigned manager' }, { status: 400 })
        }

        const review = await prisma.performanceReview.create({
            data: {
                title,
                employeeId: parseInt(employeeId),
                managerId: emp.managerId,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'SELF_ASSESSMENT_PENDING'
            }
        })

        return NextResponse.json({ success: true, review })
    } catch (error) {
        console.error('Error creating review cycle:', error)
        return NextResponse.json({ error: 'Failed to create review cycle' }, { status: 500 })
    }
}
