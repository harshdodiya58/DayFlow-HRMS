import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { validateTicketData, sanitizeString } from '@/lib/validation'
import { createNotification } from '@/lib/notifications'

// GET /api/tickets - List tickets (employee sees own, admin sees all)
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const category = searchParams.get('category')
        const priority = searchParams.get('priority')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        
        const where = {}
        
        // Non-admin can only see their own tickets
        if (payload.role !== 'ADMIN') {
            where.employeeId = payload.id
        }
        
        if (status) where.status = status
        if (category) where.category = category
        if (priority) where.priority = priority
        
        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                include: {
                    employee: {
                        select: {
                            id: true,
                            employeeId: true,
                            details: { select: { firstName: true, lastName: true, department: true, profilePic: true } }
                        }
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            details: { select: { firstName: true, lastName: true } }
                        }
                    },
                    _count: { select: { messages: true } }
                },
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.supportTicket.count({ where })
        ])
        
        // Get stats for admin
        let stats = null
        if (payload.role === 'ADMIN') {
            const [open, inProgress, resolved, urgent] = await Promise.all([
                prisma.supportTicket.count({ where: { status: 'OPEN' } }),
                prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
                prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
                prisma.supportTicket.count({ where: { priority: 'URGENT', status: { in: ['OPEN', 'IN_PROGRESS'] } } })
            ])
            stats = { open, inProgress, resolved, urgent }
        }
        
        return NextResponse.json({
            tickets,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            stats
        })
    } catch (error) {
        console.error('Ticket list error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/tickets - Create a new support ticket
export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const body = await request.json()
        
        // Validate
        const validation = validateTicketData(body)
        if (!validation.valid) {
            return NextResponse.json({ error: validation.errors.join('; ') }, { status: 400 })
        }
        
        const { category, subject, description, priority } = body
        
        const ticket = await prisma.supportTicket.create({
            data: {
                employeeId: payload.id,
                category,
                subject: sanitizeString(subject),
                description: sanitizeString(description),
                priority: priority || 'MEDIUM',
                messages: {
                    create: {
                        senderId: payload.id,
                        content: sanitizeString(description)
                    }
                }
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeId: true,
                        details: { select: { firstName: true, lastName: true } }
                    }
                },
                messages: true
            }
        })
        
        // Notify all admins about new ticket
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN', isActive: true },
            select: { id: true }
        })
        
        const employeeName = ticket.employee.details
            ? `${ticket.employee.details.firstName} ${ticket.employee.details.lastName}`
            : ticket.employee.employeeId
        
        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                type: 'TICKET_CREATED',
                title: `New Support Ticket: ${subject}`,
                message: `${employeeName} raised a ${priority || 'MEDIUM'} priority ticket in ${category.replace(/_/g, ' ').toLowerCase()}.`,
                link: `/admin/helpdesk?ticket=${ticket.id}`
            })
        }
        
        return NextResponse.json({ success: true, ticket }, { status: 201 })
    } catch (error) {
        console.error('Ticket create error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
