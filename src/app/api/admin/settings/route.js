import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/admin/settings - Fetch company settings
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        // Get or create default settings
        let settings = await prisma.companySettings.findFirst()
        
        if (!settings) {
            settings = await prisma.companySettings.create({
                data: {} // All defaults from schema
            })
        }
        
        return NextResponse.json({ settings })
    } catch (error) {
        console.error('Settings fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/admin/settings - Update company settings
export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        const payload = await verifyToken(token)
        
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const body = await request.json()
        const {
            name,
            logo,
            address,
            phone,
            email,
            website,
            timezone,
            workStartTime,
            workEndTime,
            weekendDays,
            lateThreshold,
            halfDayHours,
            payrollCurrency,
            financialYearStart,
            allowedIps,
            officeLat,
            officeLng,
            officeRadius,
            attendanceValidation
        } = body
        
        // Validate work times if provided
        if (workStartTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(workStartTime)) {
            return NextResponse.json({ error: 'Invalid work start time format (use HH:MM)' }, { status: 400 })
        }
        if (workEndTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(workEndTime)) {
            return NextResponse.json({ error: 'Invalid work end time format (use HH:MM)' }, { status: 400 })
        }
        
        // Get or create settings
        let settings = await prisma.companySettings.findFirst()
        
        const updateData = {}
        if (name !== undefined) updateData.name = name
        if (logo !== undefined) updateData.logo = logo
        if (address !== undefined) updateData.address = address
        if (phone !== undefined) updateData.phone = phone
        if (email !== undefined) updateData.email = email
        if (website !== undefined) updateData.website = website
        if (timezone !== undefined) updateData.timezone = timezone
        if (workStartTime !== undefined) updateData.workStartTime = workStartTime
        if (workEndTime !== undefined) updateData.workEndTime = workEndTime
        if (weekendDays !== undefined) updateData.weekendDays = weekendDays
        if (lateThreshold !== undefined) updateData.lateThreshold = parseInt(lateThreshold)
        if (halfDayHours !== undefined) updateData.halfDayHours = parseFloat(halfDayHours)
        if (payrollCurrency !== undefined) updateData.payrollCurrency = payrollCurrency
        if (financialYearStart !== undefined) updateData.financialYearStart = parseInt(financialYearStart)
        if (allowedIps !== undefined) updateData.allowedIps = allowedIps
        if (officeLat !== undefined) updateData.officeLat = officeLat !== null ? parseFloat(officeLat) : null
        if (officeLng !== undefined) updateData.officeLng = officeLng !== null ? parseFloat(officeLng) : null
        if (officeRadius !== undefined) updateData.officeRadius = parseInt(officeRadius)
        if (attendanceValidation !== undefined) updateData.attendanceValidation = attendanceValidation
        
        if (settings) {
            settings = await prisma.companySettings.update({
                where: { id: settings.id },
                data: updateData
            })
        } else {
            settings = await prisma.companySettings.create({
                data: updateData
            })
        }
        
        return NextResponse.json({ success: true, settings })
    } catch (error) {
        console.error('Settings update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
