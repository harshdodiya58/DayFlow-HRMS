import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
    try {
        const jobs = await prisma.jobPosting.findMany({
            include: {
                department: {
                    select: { name: true }
                },
                _count: {
                    select: { applications: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        
        return NextResponse.json({ success: true, jobs })
    } catch (error) {
        console.error('Error fetching jobs:', error)
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
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
        const {
            title, description, departmentId, location, employmentType,
            experienceMin, experienceMax, salaryRangeMin, salaryRangeMax,
            skills, status, closingDate
        } = body

        if (!title || !description) {
            return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
        }

        const job = await prisma.jobPosting.create({
            data: {
                title,
                description,
                departmentId: departmentId ? parseInt(departmentId) : null,
                location,
                employmentType: employmentType || 'FULL_TIME',
                experienceMin: experienceMin ? parseInt(experienceMin) : null,
                experienceMax: experienceMax ? parseInt(experienceMax) : null,
                salaryRangeMin: salaryRangeMin ? parseInt(salaryRangeMin) : null,
                salaryRangeMax: salaryRangeMax ? parseInt(salaryRangeMax) : null,
                skills: skills || [],
                status: status || 'DRAFT',
                postedById: payload.id,
                postedAt: status === 'OPEN' ? new Date() : null,
                closingDate: closingDate ? new Date(closingDate) : null
            }
        })

        return NextResponse.json({ success: true, job })
    } catch (error) {
        console.error('Error creating job:', error)
        return NextResponse.json({ error: 'Failed to create job posting' }, { status: 500 })
    }
}
