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

        const configs = await prisma.statutoryConfig.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })
        
        return NextResponse.json({ success: true, configs })
    } catch (error) {
        console.error('Error fetching statutory configs:', error)
        return NextResponse.json({ error: 'Failed to fetch statutory configs' }, { status: 500 })
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
        const { type, employeeContribution, employerContribution, ceiling, isActive, state } = body

        if (!type) {
            return NextResponse.json({ error: 'Statutory type is required' }, { status: 400 })
        }

        const config = await prisma.statutoryConfig.create({
            data: {
                type,
                employeeContribution: employeeContribution ? parseFloat(employeeContribution) : 0,
                employerContribution: employerContribution ? parseFloat(employerContribution) : 0,
                ceiling: ceiling ? parseFloat(ceiling) : null,
                isActive: isActive ?? true,
                state: state || null
            }
        })

        return NextResponse.json({ success: true, config })
    } catch (error) {
        console.error('Error creating statutory config:', error)
        return NextResponse.json({ error: 'Failed to create statutory config' }, { status: 500 })
    }
}
