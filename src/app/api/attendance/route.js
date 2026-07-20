import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'

// GET: Fetch today's status
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const payload = await verifyToken(token)

        // Get today's date in YYYY-MM-DD format (local timezone)
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`
        const today = new Date(todayStr + 'T00:00:00.000Z')

        const attendance = await prisma.attendance.findFirst({
            where: {
                userId: payload.id,
                date: today
            }
        })

        return NextResponse.json({
            checkedIn: !!attendance?.checkIn,
            checkedOut: !!attendance?.checkOut,
            checkInTime: attendance?.checkIn,
            checkOutTime: attendance?.checkOut,
            status: attendance?.status || null
        })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// Helper function to calculate distance in meters between two coordinates
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the earth in m
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in m
}

// POST: Check In
export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const payload = await verifyToken(token)

        const body = await request.json().catch(() => ({}))
        const { lat, lng } = body

        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`
        const today = new Date(todayStr + 'T00:00:00.000Z')
        const checkInTime = new Date()

        // Fetch company settings for validation
        const settings = await prisma.companySettings.findFirst()

        if (settings && settings.attendanceValidation !== 'NONE') {
            const mode = settings.attendanceValidation
            const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || 'unknown'

            // IP Validation
            if (mode === 'IP_ONLY' || mode === 'STRICT') {
                if (!settings.allowedIps.includes(userIp)) {
                    return NextResponse.json({ 
                        error: `Check-in denied. Your IP address (${userIp}) is not authorized.` 
                    }, { status: 403 })
                }
            }

            // Location Validation
            if (mode === 'LOCATION_ONLY' || mode === 'STRICT') {
                if (!lat || !lng) {
                    return NextResponse.json({ 
                        error: 'Location is required for check-in. Please enable GPS/Location services.' 
                    }, { status: 400 })
                }
                
                if (settings.officeLat && settings.officeLng) {
                    const distance = getDistanceFromLatLonInM(
                        parseFloat(lat), parseFloat(lng), 
                        settings.officeLat, settings.officeLng
                    )
                    
                    if (distance > settings.officeRadius) {
                        return NextResponse.json({ 
                            error: `Check-in denied. You are ${Math.round(distance)}m away from the office. Allowed radius is ${settings.officeRadius}m.` 
                        }, { status: 403 })
                    }
                }
            }
        }

        // Check if today is weekend (Saturday or Sunday)
        const dayOfWeek = now.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return NextResponse.json({ error: 'Check-in is not allowed on weekends (Saturday & Sunday)' }, { status: 400 })
        }

        // Check if already checked in or on leave
        const existing = await prisma.attendance.findFirst({
            where: { userId: payload.id, date: today }
        })

        if (existing) {
            if (existing.status === 'LEAVE') {
                return NextResponse.json({ error: 'You are on approved leave today. Cannot check in.' }, { status: 400 })
            }
            return NextResponse.json({ error: 'Already checked in today' }, { status: 400 })
        }

        const attendance = await prisma.attendance.create({
            data: {
                userId: payload.id,
                date: today,
                checkIn: checkInTime,
                status: 'PRESENT'
            }
        })
        
        // Audit log
        await createAuditLog({
            userId: payload.id,
            action: AuditActions.ATTENDANCE_CHECKIN,
            resource: AuditResources.ATTENDANCE,
            resourceId: attendance.id.toString(),
            details: `Checked in at ${checkInTime.toLocaleTimeString()}`,
            request
        })

        return NextResponse.json({ success: true, attendance })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// PUT: Check Out
export async function PUT(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const payload = await verifyToken(token)

        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`
        const today = new Date(todayStr + 'T00:00:00.000Z')
        const checkOutTime = new Date() // Current time with timezone

        const existing = await prisma.attendance.findFirst({
            where: { userId: payload.id, date: today }
        })

        if (!existing) {
            return NextResponse.json({ error: 'No check-in record found for today' }, { status: 400 })
        }

        if (existing.checkOut) {
            return NextResponse.json({ error: 'Already checked out' }, { status: 400 })
        }

        const attendance = await prisma.attendance.update({
            where: { id: existing.id },
            data: {
                checkOut: checkOutTime,
                // Logic for HALF_DAY can be added later here based on hours
            }
        })
        
        // Audit log
        await createAuditLog({
            userId: payload.id,
            action: AuditActions.ATTENDANCE_CHECKOUT,
            resource: AuditResources.ATTENDANCE,
            resourceId: attendance.id.toString(),
            details: `Checked out at ${checkOutTime.toLocaleTimeString()}`,
            request
        })

        return NextResponse.json({ success: true, attendance })

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
