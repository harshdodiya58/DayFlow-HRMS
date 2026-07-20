import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const templates = await prisma.onboardingTemplate.findMany({
            include: {
                department: { select: { name: true } },
                tasks: true,
                _count: { select: { tasks: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        
        return NextResponse.json({ success: true, templates })
    } catch (error) {
        console.error('Error fetching onboarding templates:', error)
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { name, departmentId, tasks } = body

        if (!name || !tasks || tasks.length === 0) {
            return NextResponse.json({ error: 'Name and at least one task are required' }, { status: 400 })
        }

        const template = await prisma.onboardingTemplate.create({
            data: {
                name,
                departmentId: departmentId ? parseInt(departmentId) : null,
                tasks: {
                    create: tasks.map(task => ({
                        title: task.title,
                        description: task.description,
                        assignedRole: task.assignedRole || 'EMPLOYEE',
                        dueInDays: parseInt(task.dueInDays) || 0,
                        isRequired: task.isRequired ?? true,
                        category: task.category || 'WELCOME'
                    }))
                }
            },
            include: {
                tasks: true
            }
        })

        return NextResponse.json({ success: true, template })
    } catch (error) {
        console.error('Error creating onboarding template:', error)
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }
}
