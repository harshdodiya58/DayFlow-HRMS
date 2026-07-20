import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)

        const pendingSteps = await prisma.approvalStep.findMany({
            where: { approverId: payload.id },
            include: {
                request: {
                    include: {
                        requester: { select: { firstName: true, lastName: true } },
                        workflow: { select: { name: true, type: true } }
                    }
                }
            },
            orderBy: { id: 'desc' }
        })
        
        return NextResponse.json({ success: true, approvals: pendingSteps })
    } catch (error) {
        console.error('Error fetching approvals:', error)
        return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)

        const body = await request.json()
        const { stepId, status, comments } = body

        if (!stepId || !status) {
            return NextResponse.json({ error: 'Step ID and Status are required' }, { status: 400 })
        }

        const step = await prisma.approvalStep.findUnique({
            where: { id: parseInt(stepId) },
            include: { request: true }
        })

        if (!step || step.approverId !== payload.id) {
            return NextResponse.json({ error: 'Approval step not found or access denied' }, { status: 404 })
        }

        if (step.status !== 'PENDING') {
            return NextResponse.json({ error: 'This step has already been actioned' }, { status: 400 })
        }

        // Action the step
        await prisma.approvalStep.update({
            where: { id: step.id },
            data: {
                status,
                comments,
                actedAt: new Date()
            }
        })

        // Check if workflow request should be updated
        if (status === 'REJECTED') {
            await prisma.approvalRequest.update({
                where: { id: step.requestId },
                data: { status: 'REJECTED' }
            })
        } else if (status === 'APPROVED') {
            // Check if all steps are approved
            const pendingSteps = await prisma.approvalStep.count({
                where: { requestId: step.requestId, status: 'PENDING' }
            })
            if (pendingSteps === 0) {
                await prisma.approvalRequest.update({
                    where: { id: step.requestId },
                    data: { status: 'APPROVED' }
                })
            }
        }

        return NextResponse.json({ success: true, message: `Successfully ${status.toLowerCase()}` })
    } catch (error) {
        console.error('Error actioning approval:', error)
        return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
    }
}
