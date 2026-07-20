"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus, Search, Filter, MessageSquare, Clock, CheckCircle2,
    AlertCircle, ChevronRight, Send, ArrowLeft, Tag,
    AlertTriangle, HelpCircle, X, Loader2
} from "lucide-react"
import { useToast } from "@/components/Toast"

const CATEGORIES = [
    { value: 'PAYROLL_ISSUE', label: 'Payroll Issue', icon: '💰', color: 'bg-green-50 text-green-700' },
    { value: 'LEAVE_DISCREPANCY', label: 'Leave Discrepancy', icon: '📅', color: 'bg-blue-50 text-blue-700' },
    { value: 'ATTENDANCE_ISSUE', label: 'Attendance Issue', icon: '⏰', color: 'bg-amber-50 text-amber-700' },
    { value: 'IT_SUPPORT', label: 'IT Support', icon: '💻', color: 'bg-purple-50 text-purple-700' },
    { value: 'POLICY_QUESTION', label: 'Policy Question', icon: '📋', color: 'bg-indigo-50 text-indigo-700' },
    { value: 'BENEFITS', label: 'Benefits', icon: '🎁', color: 'bg-pink-50 text-pink-700' },
    { value: 'HARASSMENT_COMPLAINT', label: 'Harassment / Complaint', icon: '🛡️', color: 'bg-red-50 text-red-700' },
    { value: 'WORKPLACE_SAFETY', label: 'Workplace Safety', icon: '⚠️', color: 'bg-orange-50 text-orange-700' },
    { value: 'GENERAL_INQUIRY', label: 'General Inquiry', icon: '❓', color: 'bg-slate-50 text-slate-700' },
    { value: 'OTHER', label: 'Other', icon: '📝', color: 'bg-gray-50 text-gray-700' }
]

const PRIORITY_COLORS = {
    LOW: 'bg-slate-100 text-slate-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700'
}

const STATUS_CONFIG = {
    OPEN: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'Open' },
    IN_PROGRESS: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'In Progress' },
    AWAITING_RESPONSE: { color: 'bg-purple-100 text-purple-700', icon: MessageSquare, label: 'Awaiting Response' },
    RESOLVED: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Resolved' },
    CLOSED: { color: 'bg-slate-100 text-slate-600', icon: CheckCircle2, label: 'Closed' }
}

export default function EmployeeHelpdesk() {
    const toast = useToast()
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [showNewTicketForm, setShowNewTicketForm] = useState(false)
    const [filterStatus, setFilterStatus] = useState('')
    const [search, setSearch] = useState('')
    const [csrfToken, setCsrfToken] = useState(null)

    // New ticket form state
    const [newTicket, setNewTicket] = useState({
        category: '',
        subject: '',
        description: '',
        priority: 'MEDIUM'
    })
    const [submitting, setSubmitting] = useState(false)

    // Message state
    const [message, setMessage] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchTickets()
    }, [filterStatus])

    const fetchTickets = async () => {
        try {
            const params = new URLSearchParams()
            if (filterStatus) params.set('status', filterStatus)
            const res = await fetch(`/api/tickets?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setTickets(data.tickets || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchTicketDetail = async (id) => {
        try {
            const res = await fetch(`/api/tickets/${id}`)
            if (res.ok) {
                const data = await res.json()
                setSelectedTicket(data.ticket)
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleCreateTicket = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify(newTicket)
            })

            if (res.ok) {
                toast.success('Ticket created successfully! HR will respond shortly.')
                setShowNewTicketForm(false)
                setNewTicket({ category: '', subject: '', description: '', priority: 'MEDIUM' })
                fetchTickets()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to create ticket')
            }
        } catch (e) {
            toast.error('Failed to create ticket')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedTicket) return
        setSendingMessage(true)

        try {
            const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({ content: message })
            })

            if (res.ok) {
                setMessage('')
                fetchTicketDetail(selectedTicket.id)
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to send message')
            }
        } catch (e) {
            toast.error('Failed to send message')
        } finally {
            setSendingMessage(false)
        }
    }

    const handleCloseTicket = async () => {
        if (!selectedTicket) return

        try {
            const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({ status: 'CLOSED' })
            })

            if (res.ok) {
                toast.success('Ticket closed successfully')
                setSelectedTicket(null)
                fetchTickets()
            }
        } catch (e) {
            toast.error('Failed to close ticket')
        }
    }

    const filteredTickets = tickets.filter(t =>
        !search || t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase())
    )

    // Ticket Detail View
    if (selectedTicket) {
        const statusInfo = STATUS_CONFIG[selectedTicket.status]
        const StatusIcon = statusInfo.icon
        const cat = CATEGORIES.find(c => c.value === selectedTicket.category)

        return (
            <div className="space-y-6">
                {/* Back Button + Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedTicket(null)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900">{selectedTicket.subject}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-mono text-slate-400">#{selectedTicket.ticketNumber.slice(-8)}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                                {selectedTicket.priority}
                            </span>
                            {cat && <span className="text-xs text-slate-500">{cat.icon} {cat.label}</span>}
                        </div>
                    </div>
                    {selectedTicket.status === 'RESOLVED' && (
                        <button
                            onClick={handleCloseTicket}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                            Close Ticket
                        </button>
                    )}
                </div>

                {/* Messages Thread */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto p-6 space-y-4">
                        {selectedTicket.messages?.map((msg) => {
                            const isOwn = msg.sender?.role !== 'ADMIN'
                            const senderName = msg.sender?.details
                                ? `${msg.sender.details.firstName} ${msg.sender.details.lastName}`
                                : 'HR Team'

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] ${isOwn ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'} rounded-2xl px-5 py-3`}>
                                        <p className={`text-xs font-medium mb-1 ${isOwn ? 'text-blue-200' : 'text-slate-500'}`}>
                                            {isOwn ? 'You' : `${senderName} (HR)`}
                                        </p>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        <p className={`text-[10px] mt-2 ${isOwn ? 'text-blue-300' : 'text-slate-400'}`}>
                                            {new Date(msg.createdAt).toLocaleString([], {
                                                month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </motion.div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    {!['CLOSED'].includes(selectedTicket.status) && (
                        <div className="border-t border-slate-100 p-4 flex gap-3">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder="Type your message..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!message.trim() || sendingMessage}
                                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    )}

                    {selectedTicket.status === 'CLOSED' && (
                        <div className="border-t border-slate-100 p-4 text-center text-slate-400 text-sm">
                            This ticket is closed. No further messages can be sent.
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">HR Helpdesk</h1>
                    <p className="text-slate-500 mt-1">Reach out to HR for any issues or questions</p>
                </div>
                <button
                    onClick={() => setShowNewTicketForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Raise a Ticket
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search tickets..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['', 'OPEN', 'IN_PROGRESS', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterStatus === status
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {status ? STATUS_CONFIG[status]?.label : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No tickets yet</h3>
                    <p className="text-slate-500 text-sm mb-6">
                        Have a question or issue? Raise a ticket and HR will get back to you.
                    </p>
                    <button
                        onClick={() => setShowNewTicketForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                        Raise Your First Ticket
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTickets.map((ticket) => {
                        const statusInfo = STATUS_CONFIG[ticket.status]
                        const StatusIcon = statusInfo.icon
                        const cat = CATEGORIES.find(c => c.value === ticket.category)

                        return (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => fetchTicketDetail(ticket.id)}
                                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-slate-400">#{ticket.ticketNumber.slice(-8)}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusInfo.label}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                            {ticket.subject}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                            {cat && <span>{cat.icon} {cat.label}</span>}
                                            <span>•</span>
                                            <span>{new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            {ticket._count?.messages > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {ticket._count.messages} messages
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* New Ticket Modal */}
            <AnimatePresence>
                {showNewTicketForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pb-28 overflow-y-auto"
                        onClick={() => setShowNewTicketForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 mt-16"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Raise a Support Ticket</h2>
                                    <p className="text-sm text-slate-500 mt-1">Describe your issue and HR will assist you</p>
                                </div>
                                <button onClick={() => setShowNewTicketForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTicket} className="p-6 space-y-5">
                                {/* Category Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setNewTicket(prev => ({ ...prev, category: cat.value }))}
                                                className={`text-left p-3 rounded-xl border-2 transition-all text-sm font-semibold flex items-center ${
                                                    newTicket.category === cat.value
                                                        ? `${cat.color} border-current shadow-sm`
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="mr-2">{cat.icon}</span>
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                                    <input
                                        type="text"
                                        required
                                        minLength={5}
                                        maxLength={200}
                                        value={newTicket.subject}
                                        onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                                        placeholder="Brief summary of your issue"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                                    <div className="flex gap-2">
                                        {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setNewTicket(prev => ({ ...prev, priority: p }))}
                                                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                                                    newTicket.priority === p
                                                        ? PRIORITY_COLORS[p] + ' ring-2 ring-offset-1 ring-current'
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                                    <textarea
                                        required
                                        minLength={10}
                                        maxLength={5000}
                                        rows={5}
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe your issue in detail. Include any relevant dates, employee IDs, or screenshots references."
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                {/* Submit */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewTicketForm(false)}
                                        className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !newTicket.category || !newTicket.subject || !newTicket.description}
                                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Submit Ticket
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
