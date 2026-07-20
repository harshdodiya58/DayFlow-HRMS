import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// In a real production system, you'd secure this with a cron secret token
// e.g., if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`)
export async function POST(request) {
    try {
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth() // 0-11

        // 1. Fetch active leave policies
        const policies = await prisma.leavePolicy.findMany({
            where: { isActive: true }
        })

        if (policies.length === 0) {
            return NextResponse.json({ success: true, message: 'No active leave policies to accrue.' })
        }

        // 2. Fetch all active employees
        const employees = await prisma.user.findMany({
            where: { isActive: true, role: { not: 'ADMIN' } }, // Optional rule: admins don't accrue
            select: { id: true }
        })

        let accrualsCount = 0

        // 3. Process accruals
        for (const emp of employees) {
            for (const policy of policies) {
                // Check if already accrued for this month to prevent duplicates
                const existingLog = await prisma.leaveAccrualLog.findFirst({
                    where: {
                        userId: emp.id,
                        leaveType: policy.leaveType,
                        month,
                        year
                    }
                })

                if (!existingLog && policy.accrualRatePerMonth > 0) {
                    // Create accrual log
                    await prisma.leaveAccrualLog.create({
                        data: {
                            userId: emp.id,
                            leaveType: policy.leaveType,
                            month,
                            year,
                            accruedAmount: policy.accrualRatePerMonth,
                            description: `Monthly Auto-Accrual for ${month + 1}/${year}`
                        }
                    })

                    // Update Leave Balance
                    const currentBalance = await prisma.leaveBalance.findUnique({
                        where: {
                            userId_leaveType_year: {
                                userId: emp.id,
                                leaveType: policy.leaveType,
                                year
                            }
                        }
                    })

                    if (currentBalance) {
                        await prisma.leaveBalance.update({
                            where: { id: currentBalance.id },
                            data: {
                                pending: currentBalance.pending + policy.accrualRatePerMonth,
                                entitled: currentBalance.entitled + policy.accrualRatePerMonth
                            }
                        })
                    } else {
                        // Create initial balance if it doesn't exist
                        await prisma.leaveBalance.create({
                            data: {
                                userId: emp.id,
                                leaveType: policy.leaveType,
                                year,
                                entitled: policy.accrualRatePerMonth,
                                pending: policy.accrualRatePerMonth,
                                used: 0,
                                carryForward: 0
                            }
                        })
                    }
                    accrualsCount++
                }
            }
        }

        return NextResponse.json({ success: true, message: `Successfully accrued ${accrualsCount} leave balances.` })
    } catch (error) {
        console.error('Error accruing leaves:', error)
        return NextResponse.json({ error: 'Failed to run leave accrual cron' }, { status: 500 })
    }
}
