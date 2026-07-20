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

        const goals = await prisma.goal.findMany({
            include: {
                employee: { select: { firstName: true, lastName: true, email: true } },
                manager: { select: { firstName: true, lastName: true } },
                department: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        
        return NextResponse.json({ success: true, goals })
    } catch (error) {
        console.error('Error fetching goals:', error)
        return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
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
        const { title, description, targetDate, employeeId, departmentId } = body

        if (!title || !employeeId) {
            return NextResponse.json({ error: 'Title and Employee are required' }, { status: 400 })
        }

        const goal = await prisma.goal.create({
            data: {
                title,
                description,
                targetDate: targetDate ? new Date(targetDate) : null,
                employeeId: parseInt(employeeId),
                departmentId: departmentId ? parseInt(departmentId) : null,
                managerId: payload.id
            }
        })

        return NextResponse.json({ success: true, goal })
    } catch (error) {
        console.error('Error creating goal:', error)
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
    }
}
