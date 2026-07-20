import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/admin/holidays - List holidays (with optional year filter)
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || new Date().getFullYear())
        
        const startDate = new Date(year, 0, 1)
        const endDate = new Date(year, 11, 31)
        
        const holidays = await prisma.holiday.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { date: 'asc' }
        })
        
        return NextResponse.json({ holidays, year })
    } catch (error) {
        console.error('Holiday fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/holidays - Create a holiday
export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const body = await request.json()
        
        // Support bulk creation
        if (Array.isArray(body.holidays)) {
            const created = await prisma.holiday.createMany({
                data: body.holidays.map(h => ({
                    name: h.name,
                    date: new Date(h.date),
                    type: h.type || 'COMPANY',
                    isOptional: h.isOptional || false,
                    description: h.description || null
                })),
                skipDuplicates: true
            })
            
            return NextResponse.json({ success: true, count: created.count }, { status: 201 })
        }
        
        // Single holiday creation
        const { name, date, type, isOptional, description } = body
        
        if (!name || !date) {
            return NextResponse.json({ error: 'Holiday name and date are required' }, { status: 400 })
        }
        
        const holiday = await prisma.holiday.create({
            data: {
                name,
                date: new Date(date),
                type: type || 'COMPANY',
                isOptional: isOptional || false,
                description: description || null
            }
        })
        
        return NextResponse.json({ success: true, holiday }, { status: 201 })
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'A holiday with this name on this date already exists' }, { status: 409 })
        }
        console.error('Holiday create error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/admin/holidays - Edit a holiday
export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const body = await request.json()
        const { id, name, date, type, isOptional, description } = body
        
        if (!id || !name || !date) {
            return NextResponse.json({ error: 'Holiday ID, name, and date are required' }, { status: 400 })
        }
        
        const holiday = await prisma.holiday.update({
            where: { id: parseInt(id) },
            data: {
                name,
                date: new Date(date),
                type: type || 'COMPANY',
                isOptional: isOptional || false,
                description: description || null
            }
        })
        
        return NextResponse.json({ success: true, holiday })
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'A holiday with this name on this date already exists' }, { status: 409 })
        }
        console.error('Holiday edit error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/admin/holidays - Delete a holiday
export async function DELETE(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const { searchParams } = new URL(request.url)
        const id = parseInt(searchParams.get('id'))
        
        if (!id) {
            return NextResponse.json({ error: 'Holiday ID is required' }, { status: 400 })
        }
        
        await prisma.holiday.delete({ where: { id } })
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Holiday delete error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
