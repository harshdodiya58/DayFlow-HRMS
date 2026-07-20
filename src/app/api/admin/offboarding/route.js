import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const processes = await prisma.offboardingProcess.findMany({
            include: {
                employee: { select: { firstName: true, lastName: true, email: true } },
                initiatedBy: { select: { firstName: true, lastName: true } }
            },
            orderBy: { lastWorkingDay: 'asc' }
        })
        
        return NextResponse.json({ success: true, processes })
    } catch (error) {
        console.error('Error fetching offboarding processes:', error)
        return NextResponse.json({ error: 'Failed to fetch offboarding data' }, { status: 500 })
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
        const { employeeId, type, lastWorkingDay, notes } = body

        if (!employeeId || !type || !lastWorkingDay) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const offboarding = await prisma.offboardingProcess.create({
            data: {
                employeeId: parseInt(employeeId),
                type,
                lastWorkingDay: new Date(lastWorkingDay),
                notes,
                initiatedById: payload.id,
                status: 'INITIATED'
            }
        })

        // Also update the employee status if they are already gone
        if (new Date(lastWorkingDay) <= new Date()) {
            await prisma.user.update({
                where: { id: parseInt(employeeId) },
                data: { status: 'INACTIVE' }
            })
        }

        return NextResponse.json({ success: true, offboarding })
    } catch (error) {
        console.error('Error initiating offboarding:', error)
        return NextResponse.json({ error: 'Failed to initiate offboarding' }, { status: 500 })
    }
}
