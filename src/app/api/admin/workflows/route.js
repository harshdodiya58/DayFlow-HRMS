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

        const workflows = await prisma.approvalWorkflow.findMany({
            include: {
                department: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        
        return NextResponse.json({ success: true, workflows })
    } catch (error) {
        console.error('Error fetching workflows:', error)
        return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
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
        const { name, type, departmentId } = body

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and Type are required' }, { status: 400 })
        }

        const workflow = await prisma.approvalWorkflow.create({
            data: {
                name,
                type,
                departmentId: departmentId ? parseInt(departmentId) : null
            }
        })

        return NextResponse.json({ success: true, workflow })
    } catch (error) {
        console.error('Error creating workflow:', error)
        return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
    }
}
