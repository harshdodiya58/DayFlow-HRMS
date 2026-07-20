import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)

        const declarations = await prisma.taxDeclaration.findMany({
            where: payload.role === 'ADMIN' ? {} : { employeeId: payload.id },
            include: {
                employee: { select: { firstName: true, lastName: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        
        return NextResponse.json({ success: true, declarations })
    } catch (error) {
        console.error('Error fetching tax declarations:', error)
        return NextResponse.json({ error: 'Failed to fetch tax declarations' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const payload = await verifyToken(token)

        const body = await request.json()
        const { financialYear, section80C, section80D, hra, otherDeductions, proofUrls } = body

        if (!financialYear) {
            return NextResponse.json({ error: 'Financial year is required' }, { status: 400 })
        }

        const declaration = await prisma.taxDeclaration.create({
            data: {
                employeeId: payload.id,
                financialYear,
                section80C: section80C ? parseFloat(section80C) : 0,
                section80D: section80D ? parseFloat(section80D) : 0,
                hra: hra ? parseFloat(hra) : 0,
                otherDeductions: otherDeductions ? parseFloat(otherDeductions) : 0,
                proofUrls: proofUrls || []
            }
        })

        return NextResponse.json({ success: true, declaration })
    } catch (error) {
        console.error('Error submitting tax declaration:', error)
        return NextResponse.json({ error: 'Failed to submit tax declaration' }, { status: 500 })
    }
}
