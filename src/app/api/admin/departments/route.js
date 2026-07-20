import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/admin/departments - List all departments
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const departments = await prisma.department.findMany({
            include: {
                head: {
                    select: {
                        id: true,
                        employeeId: true,
                        details: { select: { firstName: true, lastName: true } }
                    }
                },
                parent: { select: { id: true, name: true } },
                _count: { select: { employees: true } }
            },
            orderBy: { name: 'asc' }
        })
        
        return NextResponse.json({ departments })
    } catch (error) {
        console.error('Department fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/departments - Create a department
export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const { name, code, description, headId, parentId } = await request.json()
        
        if (!name || !code) {
            return NextResponse.json({ error: 'Department name and code are required' }, { status: 400 })
        }
        
        if (code.length > 10) {
            return NextResponse.json({ error: 'Department code must be 10 characters or less' }, { status: 400 })
        }
        
        // Check uniqueness
        const existing = await prisma.department.findFirst({
            where: { OR: [{ name }, { code: code.toUpperCase() }] }
        })
        
        if (existing) {
            return NextResponse.json({ error: 'Department with this name or code already exists' }, { status: 409 })
        }
        
        const department = await prisma.department.create({
            data: {
                name,
                code: code.toUpperCase(),
                description: description || null,
                headId: headId || null,
                parentId: parentId || null
            },
            include: {
                head: {
                    select: {
                        id: true,
                        details: { select: { firstName: true, lastName: true } }
                    }
                }
            }
        })
        
        return NextResponse.json({ success: true, department }, { status: 201 })
    } catch (error) {
        console.error('Department create error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
