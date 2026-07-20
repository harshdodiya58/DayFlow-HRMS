import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { sanitizeString } from '@/lib/validation'
import { createNotification } from '@/lib/notifications'

// GET /api/tickets/[id] - Get single ticket with messages
export async function GET(request, { params }) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const { id } = await params
        const ticketId = parseInt(id)
        
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
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
                        details: { select: { firstName: true, lastName: true, profilePic: true } }
                    }
                },
                messages: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                role: true,
                                details: { select: { firstName: true, lastName: true, profilePic: true } }
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        })
        
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }
        
        // Non-admin can only view own tickets
        if (payload.role !== 'ADMIN' && ticket.employeeId !== payload.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        // Filter internal notes from employee view
        if (payload.role !== 'ADMIN') {
            ticket.messages = ticket.messages.filter(m => !m.isInternal)
        }
        
        return NextResponse.json({ ticket })
    } catch (error) {
        console.error('Ticket detail error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/tickets/[id] - Add a message to the ticket
export async function POST(request, { params }) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const { id } = await params
        const ticketId = parseInt(id)
        
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            select: { id: true, employeeId: true, assignedToId: true, status: true, subject: true }
        })
        
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }
        
        // Verify access
        if (payload.role !== 'ADMIN' && ticket.employeeId !== payload.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        // Don't allow messages on closed tickets
        if (ticket.status === 'CLOSED') {
            return NextResponse.json({ error: 'Cannot add messages to a closed ticket' }, { status: 400 })
        }
        
        const { content, isInternal } = await request.json()
        
        if (!content || content.trim().length < 1) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
        }
        
        // Only admins can create internal notes
        const internal = payload.role === 'ADMIN' ? (isInternal || false) : false
        
        const message = await prisma.ticketMessage.create({
            data: {
                ticketId,
                senderId: payload.id,
                content: sanitizeString(content),
                isInternal: internal
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        role: true,
                        details: { select: { firstName: true, lastName: true, profilePic: true } }
                    }
                }
            }
        })
        
        // Update ticket status based on who replied
        const newStatus = payload.role === 'ADMIN' ? 'AWAITING_RESPONSE' : 'IN_PROGRESS'
        await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { 
                status: newStatus,
                updatedAt: new Date()
            }
        })
        
        // Notify the other party
        if (!internal) {
            const senderName = message.sender.details
                ? `${message.sender.details.firstName} ${message.sender.details.lastName}`
                : 'HR Team'
            
            const notifyUserId = payload.role === 'ADMIN' ? ticket.employeeId : (ticket.assignedToId || null)
            
            if (notifyUserId) {
                await createNotification({
                    userId: notifyUserId,
                    type: 'TICKET_UPDATED',
                    title: `Reply on ticket: ${ticket.subject}`,
                    message: `${senderName} replied to your support ticket.`,
                    link: payload.role === 'ADMIN' 
                        ? `/dashboard/helpdesk?ticket=${ticketId}` 
                        : `/admin/helpdesk?ticket=${ticketId}`
                })
            }
        }
        
        return NextResponse.json({ success: true, message })
    } catch (error) {
        console.error('Ticket message error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/tickets/[id] - Update ticket (status, assignment, priority)
export async function PUT(request, { params }) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const { id } = await params
        const ticketId = parseInt(id)
        
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            select: { id: true, employeeId: true, subject: true, status: true }
        })
        
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }
        
        const body = await request.json()
        const updateData = {}
        
        // Admin can update status, assignment, priority
        if (payload.role === 'ADMIN') {
            if (body.status) {
                updateData.status = body.status
                if (body.status === 'RESOLVED') updateData.resolvedAt = new Date()
                if (body.status === 'CLOSED') updateData.closedAt = new Date()
            }
            if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId
            if (body.priority) updateData.priority = body.priority
        }
        
        // Employee can only close their own resolved tickets
        if (payload.role !== 'ADMIN') {
            if (ticket.employeeId !== payload.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
            }
            if (body.status === 'CLOSED' && ticket.status === 'RESOLVED') {
                updateData.status = 'CLOSED'
                updateData.closedAt = new Date()
            }
        }
        
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
        }
        
        const updated = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: updateData,
            include: {
                employee: {
                    select: {
                        id: true,
                        details: { select: { firstName: true, lastName: true } }
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        details: { select: { firstName: true, lastName: true } }
                    }
                }
            }
        })
        
        // Notify employee of status changes
        if (updateData.status && payload.role === 'ADMIN') {
            const statusMessages = {
                IN_PROGRESS: 'Your support ticket is now being reviewed.',
                RESOLVED: 'Your support ticket has been resolved. Please close it if you are satisfied.',
                CLOSED: 'Your support ticket has been closed.'
            }
            
            if (statusMessages[updateData.status]) {
                await createNotification({
                    userId: ticket.employeeId,
                    type: updateData.status === 'RESOLVED' ? 'TICKET_RESOLVED' : 'TICKET_UPDATED',
                    title: `Ticket Update: ${ticket.subject}`,
                    message: statusMessages[updateData.status],
                    link: `/dashboard/helpdesk?ticket=${ticketId}`
                })
            }
        }
        
        return NextResponse.json({ success: true, ticket: updated })
    } catch (error) {
        console.error('Ticket update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
