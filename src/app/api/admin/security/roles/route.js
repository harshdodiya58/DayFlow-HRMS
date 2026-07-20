import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/admin/security/roles - List all users and their roles
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                employeeId: true,
                details: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { id: 'asc' }
        })
        
        return NextResponse.json({ users })
    } catch (error) {
        console.error('Roles fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/admin/security/roles - Update a user's role
export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const { userId, role } = await request.json()
        
        if (!userId || !role) {
            return NextResponse.json({ error: 'User ID and Role are required' }, { status: 400 })
        }
        
        // Prevent changing own role (super admin protection)
        if (userId === payload.id && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 })
        }
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role }
        })
        
        return NextResponse.json({ success: true, user: { id: updatedUser.id, role: updatedUser.role } })
    } catch (error) {
        console.error('Role update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
