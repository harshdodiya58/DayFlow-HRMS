import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const departmentId = searchParams.get('departmentId')
        const location = searchParams.get('location')
        
        const where = {
            status: 'OPEN'
        }
        
        if (departmentId) {
            where.departmentId = parseInt(departmentId)
        }
        if (location) {
            where.location = {
                contains: location,
                mode: 'insensitive'
            }
        }

        const jobs = await prisma.jobPosting.findMany({
            where,
            include: {
                department: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                postedAt: 'desc'
            }
        })

        return NextResponse.json({ success: true, jobs })
    } catch (error) {
        console.error('Error fetching jobs:', error)
        return NextResponse.json(
            { error: 'Failed to fetch job postings' },
            { status: 500 }
        )
    }
}
