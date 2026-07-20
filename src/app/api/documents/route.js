import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET /api/documents - List documents for the current user (or specific user if admin)
export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const { searchParams } = new URL(request.url)
        const targetUserId = searchParams.get('userId')
        
        let queryUserId = payload.id
        
        // Admins can view other users' documents
        if (targetUserId && payload.role === 'ADMIN') {
            queryUserId = parseInt(targetUserId)
        }

        const documents = await prisma.document.findMany({
            where: { ownerId: queryUserId },
            orderBy: { createdAt: 'desc' },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        details: { select: { firstName: true, lastName: true } }
                    }
                }
            }
        })

        return NextResponse.json({ documents })
    } catch (e) {
        console.error('Documents fetch error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/documents - Upload a document
export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        
        // Parse form data
        const formData = await request.formData()
        const file = formData.get('file')
        const title = formData.get('title')
        const type = formData.get('type')
        const targetUserId = formData.get('userId') // Admin uploading for employee
        
        if (!file || !title || !type) {
            return NextResponse.json({ error: 'File, title, and type are required' }, { status: 400 })
        }
        
        let ownerId = payload.id
        if (targetUserId && payload.role === 'ADMIN') {
            ownerId = parseInt(targetUserId)
        }
        
        // Save file locally to public/uploads/documents
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Ensure directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }
        
        // Generate unique filename
        const ext = file.name.split('.').pop()
        const uniqueFilename = `${ownerId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        const filePath = join(uploadDir, uniqueFilename)
        
        // Write file
        await writeFile(filePath, buffer)
        const fileUrl = `/uploads/documents/${uniqueFilename}`
        
        // Save to DB
        const document = await prisma.document.create({
            data: {
                ownerId: ownerId,
                name: title,
                type: type,
                fileUrl,
                uploadedById: payload.id,
                fileSize: file.size,
                mimeType: file.type
            }
        })
        
        // Audit log
        await createAuditLog({
            userId: payload.id,
            action: AuditActions.SETTINGS_UPDATED, // Reuse settings updated for now, or could create DOCUMENT_UPLOADED
            resource: 'DOCUMENT',
            resourceId: document.id.toString(),
            details: `Uploaded document ${title} of type ${type} for user ${ownerId}`,
            request
        })

        return NextResponse.json({ success: true, document }, { status: 201 })
    } catch (e) {
        console.error('Document upload error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/documents - Delete a document
export async function DELETE(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        const { searchParams } = new URL(request.url)
        const id = parseInt(searchParams.get('id'))
        
        if (!id) return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
        
        const document = await prisma.document.findUnique({ where: { id } })
        
        if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        
        // Only admin or the document owner can delete
        if (payload.role !== 'ADMIN' && document.ownerId !== payload.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        await prisma.document.delete({ where: { id } })
        
        // Note: In a production app, we should also delete the physical file from the disk here using fs.unlink
        
        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('Document delete error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
