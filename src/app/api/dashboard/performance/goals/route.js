import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)

        const goals = await prisma.goal.findMany({
            where: { employeeId: payload.id },
            include: {
                manager: { select: { firstName: true, lastName: true } },
                department: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        
        return NextResponse.json({ success: true, goals })
    } catch (error) {
        console.error('Error fetching employee goals:', error)
        return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)

        const body = await request.json()
        const { goalId, progress, status } = body

        if (!goalId) {
            return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
        }

        const goal = await prisma.goal.findUnique({ where: { id: parseInt(goalId) } })

        if (!goal || goal.employeeId !== payload.id) {
            return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
        }

        const updatedGoal = await prisma.goal.update({
            where: { id: parseInt(goalId) },
            data: {
                progress: progress !== undefined ? parseInt(progress) : goal.progress,
                status: status || goal.status
            }
        })

        return NextResponse.json({ success: true, goal: updatedGoal })
    } catch (error) {
        console.error('Error updating goal:', error)
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
    }
}
