import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/admin/leave-policy - List all leave policies
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const policies = await prisma.leavePolicy.findMany({
            orderBy: { leaveType: 'asc' }
        })
        
        return NextResponse.json({ policies })
    } catch (error) {
        console.error('Leave policy fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/leave-policy - Create or update leave policy
export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const body = await request.json()
        const {
            leaveType,
            annualEntitlement,
            maxCarryForward,
            maxConsecutiveDays,
            requiresApproval,
            minNoticeDays,
            description
        } = body
        
        if (!leaveType) {
            return NextResponse.json({ error: 'Leave type is required' }, { status: 400 })
        }
        
        const policy = await prisma.leavePolicy.upsert({
            where: { leaveType },
            update: {
                annualEntitlement: annualEntitlement ?? 12,
                maxCarryForward: maxCarryForward ?? 5,
                maxConsecutiveDays: maxConsecutiveDays ?? 5,
                requiresApproval: requiresApproval ?? true,
                minNoticeDays: minNoticeDays ?? 1,
                description: description || null
            },
            create: {
                leaveType,
                annualEntitlement: annualEntitlement ?? 12,
                maxCarryForward: maxCarryForward ?? 5,
                maxConsecutiveDays: maxConsecutiveDays ?? 5,
                requiresApproval: requiresApproval ?? true,
                minNoticeDays: minNoticeDays ?? 1,
                description: description || null
            }
        })
        
        return NextResponse.json({ success: true, policy })
    } catch (error) {
        console.error('Leave policy update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/admin/leave-policy - Initialize leave balances for all employees for a year
export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const { year } = await request.json()
        const targetYear = year || new Date().getFullYear()
        
        // Get all active policies
        const policies = await prisma.leavePolicy.findMany({
            where: { isActive: true }
        })
        
        // Get all active employees
        const employees = await prisma.user.findMany({
            where: { isActive: true, role: 'EMPLOYEE' },
            select: { id: true }
        })
        
        let created = 0
        let skipped = 0
        
        for (const emp of employees) {
            for (const policy of policies) {
                // Check if balance already exists
                const existing = await prisma.leaveBalance.findUnique({
                    where: {
                        userId_leaveType_year: {
                            userId: emp.id,
                            leaveType: policy.leaveType,
                            year: targetYear
                        }
                    }
                })
                
                if (existing) {
                    skipped++
                    continue
                }
                
                // Check for carry forward from previous year
                let carryForward = 0
                const previousBalance = await prisma.leaveBalance.findUnique({
                    where: {
                        userId_leaveType_year: {
                            userId: emp.id,
                            leaveType: policy.leaveType,
                            year: targetYear - 1
                        }
                    }
                })
                
                if (previousBalance) {
                    const remaining = previousBalance.entitled + previousBalance.carryForward - previousBalance.used
                    carryForward = Math.min(Math.max(remaining, 0), policy.maxCarryForward)
                }
                
                await prisma.leaveBalance.create({
                    data: {
                        userId: emp.id,
                        leaveType: policy.leaveType,
                        year: targetYear,
                        entitled: policy.annualEntitlement,
                        carryForward
                    }
                })
                created++
            }
        }
        
        return NextResponse.json({
            success: true,
            message: `Initialized ${created} leave balances for ${targetYear}. ${skipped} already existed.`,
            created,
            skipped
        })
    } catch (error) {
        console.error('Leave balance init error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
