import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)

        const tasks = await prisma.onboardingProgress.findMany({
            where: {
                employeeId: payload.id
            },
            include: {
                task: true
            },
            orderBy: {
                task: { dueInDays: 'asc' }
            }
        })
        
        return NextResponse.json({ success: true, tasks })
    } catch (error) {
        console.error('Error fetching onboarding progress:', error)
        return NextResponse.json({ error: 'Failed to fetch onboarding tasks' }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)
        const body = await request.json()
        const { progressId, status } = body

        // Verify the progress belongs to the user
        const progress = await prisma.onboardingProgress.findUnique({
            where: { id: parseInt(progressId) },
            include: { task: true }
        })

        if (!progress) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        // Only allow updating if assigned role matches or user is admin
        if (progress.employeeId !== payload.id && payload.role !== 'ADMIN' && payload.role !== 'HR') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Only employee can complete employee tasks
        if (progress.task.assignedRole === 'EMPLOYEE' && payload.id !== progress.employeeId) {
             return NextResponse.json({ error: 'Only the employee can complete this task' }, { status: 403 })
        }

        const updated = await prisma.onboardingProgress.update({
            where: { id: parseInt(progressId) },
            data: {
                status,
                completedAt: status === 'COMPLETED' ? new Date() : null,
                completedById: status === 'COMPLETED' ? payload.id : null
            }
        })

        return NextResponse.json({ success: true, progress: updated })
    } catch (error) {
        console.error('Error updating onboarding progress:', error)
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }
}
