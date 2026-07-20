import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { sanitizeString } from '@/lib/validation'

// GET /api/admin/announcements - List announcements
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const { searchParams } = new URL(request.url)
        const activeOnly = searchParams.get('active') !== 'false'
        
        const where = {}
        
        if (activeOnly) {
            const now = new Date()
            where.isActive = true
            where.startsAt = { lte: now }
            where.OR = [
                { expiresAt: null },
                { expiresAt: { gte: now } }
            ]
        }
        
        // Non-admin only see announcements for their department or all
        if (payload.role !== 'ADMIN') {
            const user = await prisma.user.findUnique({
                where: { id: payload.id },
                select: { details: { select: { departmentId: true } } }
            })
            
            where.AND = [
                ...(where.AND || []),
                {
                    OR: [
                        { departmentId: null },     // Company-wide
                        { departmentId: user?.details?.departmentId || -1 }  // Department specific
                    ]
                }
            ]
        }
        
        const announcements = await prisma.announcement.findMany({
            where,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        details: { select: { firstName: true, lastName: true, profilePic: true } }
                    }
                },
                department: {
                    select: { id: true, name: true }
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        })
        
        return NextResponse.json({ announcements })
    } catch (error) {
        console.error('Announcements fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/announcements - Create an announcement (Admin only)
export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const body = await request.json()
        const { title, content, priority, departmentId, startsAt, expiresAt, isPinned } = body
        
        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
        }
        
        if (title.length > 200) {
            return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 })
        }
        
        if (content.length > 5000) {
            return NextResponse.json({ error: 'Content must be 5000 characters or less' }, { status: 400 })
        }
        
        const announcement = await prisma.announcement.create({
            data: {
                title: sanitizeString(title),
                content: sanitizeString(content),
                priority: priority || 'NORMAL',
                createdById: payload.id,
                departmentId: departmentId || null,
                startsAt: startsAt ? new Date(startsAt) : new Date(),
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                isPinned: isPinned || false
            },
            include: {
                createdBy: {
                    select: {
                        details: { select: { firstName: true, lastName: true } }
                    }
                }
            }
        })
        
        // Send notifications to target employees
        const targetWhere = { isActive: true, role: 'EMPLOYEE' }
        if (departmentId) {
            targetWhere.details = { departmentId }
        }
        
        const targetEmployees = await prisma.user.findMany({
            where: targetWhere,
            select: { id: true }
        })
        
        // Bulk create notifications (non-blocking)
        const notificationPromises = targetEmployees.map(emp =>
            prisma.notification.create({
                data: {
                    userId: emp.id,
                    type: 'ANNOUNCEMENT',
                    title: `📢 ${title}`,
                    message: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
                    link: '/dashboard/announcements'
                }
            }).catch(e => console.error('Notification error:', e))
        )
        
        Promise.allSettled(notificationPromises)
        
        return NextResponse.json({ success: true, announcement }, { status: 201 })
    } catch (error) {
        console.error('Announcement create error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/admin/announcements - Update an announcement
export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const body = await request.json()
        const { id, ...updateData } = body
        
        if (!id) {
            return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
        }
        
        // Sanitize text fields
        if (updateData.title) updateData.title = sanitizeString(updateData.title)
        if (updateData.content) updateData.content = sanitizeString(updateData.content)
        if (updateData.expiresAt) updateData.expiresAt = new Date(updateData.expiresAt)
        if (updateData.startsAt) updateData.startsAt = new Date(updateData.startsAt)
        
        const announcement = await prisma.announcement.update({
            where: { id: parseInt(id) },
            data: updateData
        })
        
        return NextResponse.json({ success: true, announcement })
    } catch (error) {
        console.error('Announcement update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/admin/announcements - Delete an announcement
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
            return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
        }
        
        await prisma.announcement.delete({ where: { id } })
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Announcement delete error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
