import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        
        // Fetch user context for personalized AI responses
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            include: { 
                details: {
                    include: { departmentRef: true }
                },
                leaveBalances: {
                    where: { year: new Date().getFullYear() }
                },
                attendance: {
                    orderBy: { date: 'desc' },
                    take: 5
                },
                payrolls: {
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ],
                    take: 1
                }
            }
        })

        const body = await request.json()
        const { message, history } = body

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // Initialize Gemini API
        const apiKey = process.env.GEMINI_API_KEY
        
        if (!apiKey) {
            return NextResponse.json({ 
                success: true,
                response: "To activate my true AI capabilities, please add your `GEMINI_API_KEY` to the `.env` file! For now, I'm just a placeholder. Please reach out to HR through the Helpdesk if you need immediate assistance."
            })
        }

        const ai = new GoogleGenAI({ apiKey: apiKey })

        // Build system prompt with context
        const leaveContext = user.leaveBalances?.map(lb => `${lb.leaveType}: ${lb.entitled + lb.carryForward - lb.used - lb.pending} days left`).join(', ') || 'No leave balances found.';
        const recentAttendance = user.attendance?.map(a => `${a.date.toISOString().split('T')[0]}: ${a.status} (Check In: ${a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : 'N/A'})`).join('\n') || 'No recent attendance.';
        const recentPayroll = user.payrolls?.[0] ? `Month ${user.payrolls[0].month}/${user.payrolls[0].year}: Net Pay ₹${user.payrolls[0].netPay}` : 'No recent payroll generated.';

        const systemPrompt = `You are "DayFlow AI", the official virtual HR assistant for the company "DayFlow".
You are assisting an employee named ${user.details?.firstName || 'Employee'} ${user.details?.lastName || ''}.
Their department is ${user.details?.departmentRef?.name || user.details?.department || 'General'}.

Here is their current context data:
[Leave Balances]: ${leaveContext}
[Recent Attendance (Last 5 Days)]:
${recentAttendance}
[Latest Payroll]: ${recentPayroll}

Your goal is to answer their HR-related queries professionally, concisely, and accurately based on standard corporate practices and the provided context. 
If they ask about their leave balance, attendance, or payroll, use the context data above to give them an exact answer.
If they have a complex issue (like payroll disputes, harassment, or IT support), instruct them to raise a ticket in the "Helpdesk" section.
Keep responses friendly, helpful, and concise (under 100 words). Use standard markdown formatting (e.g., **bold**, - lists) to make responses readable.`

        // Convert history to Gemini format (optional, keeping it simple for now)
        const chatContext = history 
            ? history.map(h => `${h.role === 'user' ? 'Employee' : 'DayFlow AI'}: ${h.content}`).join('\n')
            : ''

        const fullPrompt = `${systemPrompt}\n\nChat History:\n${chatContext}\n\nEmployee: ${message}\nDayFlow AI:`

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        })

        return NextResponse.json({ 
            success: true, 
            response: response.text 
        })
    } catch (e) {
        console.error('AI Agent error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
