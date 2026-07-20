"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search, MessageSquare, Clock, CheckCircle2, AlertCircle,
    ChevronRight, Send, ArrowLeft, User, Filter, Loader2,
    AlertTriangle, BarChart3, X
} from "lucide-react"
import { useToast } from "@/components/Toast"

const PRIORITY_COLORS = {
    LOW: 'bg-slate-100 text-slate-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700 animate-pulse'
}

const STATUS_CONFIG = {
    OPEN: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'Open' },
    IN_PROGRESS: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'In Progress' },
    AWAITING_RESPONSE: { color: 'bg-purple-100 text-purple-700', icon: MessageSquare, label: 'Awaiting' },
    RESOLVED: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Resolved' },
    CLOSED: { color: 'bg-slate-100 text-slate-600', icon: CheckCircle2, label: 'Closed' }
}

const CATEGORY_LABELS = {
    PAYROLL_ISSUE: '💰 Payroll', LEAVE_DISCREPANCY: '📅 Leave',
    ATTENDANCE_ISSUE: '⏰ Attendance', IT_SUPPORT: '💻 IT',
    POLICY_QUESTION: '📋 Policy', BENEFITS: '🎁 Benefits',
    HARASSMENT_COMPLAINT: '🛡️ Harassment', WORKPLACE_SAFETY: '⚠️ Safety',
    GENERAL_INQUIRY: '❓ General', OTHER: '📝 Other'
}

export default function AdminHelpdesk() {
    const toast = useToast()
    const [tickets, setTickets] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [filterStatus, setFilterStatus] = useState('')
    const [filterPriority, setFilterPriority] = useState('')
    const [search, setSearch] = useState('')
    const [csrfToken, setCsrfToken] = useState(null)

    // Message & actions state
    const [message, setMessage] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [sendingMessage, setSendingMessage] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchTickets()
    }, [filterStatus, filterPriority])

    const fetchTickets = async () => {
        try {
            const params = new URLSearchParams()
            if (filterStatus) params.set('status', filterStatus)
            if (filterPriority) params.set('priority', filterPriority)

            const res = await fetch(`/api/tickets?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setTickets(data.tickets || [])
                setStats(data.stats)
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
                body: JSON.stringify({ content: message, isInternal })
            })

            if (res.ok) {
                setMessage('')
                setIsInternal(false)
                fetchTicketDetail(selectedTicket.id)
            }
        } catch (e) {
            toast.error('Failed to send message')
        } finally {
            setSendingMessage(false)
        }
    }

    const handleUpdateTicket = async (updates) => {
        if (!selectedTicket) return

        try {
            const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify(updates)
            })

            if (res.ok) {
                toast.success('Ticket updated')
                fetchTicketDetail(selectedTicket.id)
                fetchTickets()
            }
        } catch (e) {
            toast.error('Failed to update ticket')
        }
    }

    const filteredTickets = tickets.filter(t =>
        !search ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.employee?.details?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        t.employee?.details?.lastName?.toLowerCase().includes(search.toLowerCase())
    )

    // Ticket Detail View
    if (selectedTicket) {
        const statusInfo = STATUS_CONFIG[selectedTicket.status]
        const empName = selectedTicket.employee?.details
            ? `${selectedTicket.employee.details.firstName} ${selectedTicket.employee.details.lastName}`
            : selectedTicket.employee?.employeeId

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-lg hover:bg-slate-100">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900">{selectedTicket.subject}</h1>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs font-mono text-slate-400">#{selectedTicket.ticketNumber.slice(-8)}</span>
                            <span className="text-xs text-slate-500">by {empName}</span>
                            <span className="text-xs text-slate-400">{selectedTicket.employee?.details?.department}</span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Messages */}
                    <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto p-6 space-y-4">
                            {selectedTicket.messages?.map((msg) => {
                                const isHR = msg.sender?.role === 'ADMIN'
                                const senderName = msg.sender?.details
                                    ? `${msg.sender.details.firstName} ${msg.sender.details.lastName}`
                                    : 'Unknown'

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${isHR ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                                            msg.isInternal
                                                ? 'bg-amber-50 border-2 border-dashed border-amber-200 text-amber-900'
                                                : isHR
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-100 text-slate-800'
                                        }`}>
                                            {msg.isInternal && (
                                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">🔒 Internal Note</p>
                                            )}
                                            <p className={`text-xs font-medium mb-1 ${
                                                msg.isInternal ? 'text-amber-600' : isHR ? 'text-blue-200' : 'text-slate-500'
                                            }`}>
                                                {isHR ? `${senderName} (HR)` : senderName}
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-[10px] mt-2 ${
                                                msg.isInternal ? 'text-amber-400' : isHR ? 'text-blue-300' : 'text-slate-400'
                                            }`}>
                                                {new Date(msg.createdAt).toLocaleString([], {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {!['CLOSED'].includes(selectedTicket.status) && (
                            <div className="border-t border-slate-100 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isInternal}
                                            onChange={(e) => setIsInternal(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-amber-600 font-medium">🔒 Internal note (employee won't see this)</span>
                                    </label>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder={isInternal ? "Add internal note..." : "Reply to employee..."}
                                        className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            isInternal ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                                        }`}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!message.trim() || sendingMessage}
                                        className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-4">
                        {/* Status */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm">Status</h3>
                            <div className="space-y-2">
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleUpdateTicket({ status: key })}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                            selectedTicket.status === key
                                                ? config.color + ' ring-2 ring-offset-1'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm">Priority</h3>
                            <div className="flex flex-wrap gap-2">
                                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => handleUpdateTicket({ priority: p })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                            selectedTicket.priority === p
                                                ? PRIORITY_COLORS[p] + ' ring-2 ring-offset-1'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Employee Info */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm">Employee</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm">
                                    {empName?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 text-sm">{empName}</p>
                                    <p className="text-xs text-slate-500">{selectedTicket.employee?.employeeId}</p>
                                    <p className="text-xs text-slate-400">{selectedTicket.employee?.details?.department}</p>
                                </div>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <h3 className="font-semibold text-slate-900 text-sm mb-2">Category</h3>
                            <p className="text-sm text-slate-600">
                                {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">HR Helpdesk</h1>
                <p className="text-slate-500 mt-1">Manage employee support tickets</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Open', value: stats.open, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Resolved', value: stats.resolved, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Urgent', value: stats.urgent, color: 'text-red-600', bg: 'bg-red-50' }
                    ].map((stat) => (
                        <div key={stat.label} className={`${stat.bg} rounded-2xl p-5`}>
                            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                            <p className={`text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by subject, ID, or employee..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['', 'OPEN', 'IN_PROGRESS', 'AWAITING_RESPONSE', 'RESOLVED'].map(status => (
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

            {/* Tickets Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No tickets found</h3>
                    <p className="text-slate-500 text-sm">No support tickets match your current filters.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold tracking-wider">
                                    <th className="px-6 py-4">Ticket</th>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTickets.map(ticket => {
                                    const statusInfo = STATUS_CONFIG[ticket.status]
                                    const StatusIcon = statusInfo.icon
                                    const empName = ticket.employee?.details
                                        ? `${ticket.employee.details.firstName} ${ticket.employee.details.lastName}`
                                        : ticket.employee?.employeeId

                                    return (
                                        <tr
                                            key={ticket.id}
                                            onClick={() => fetchTicketDetail(ticket.id)}
                                            className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                                    {ticket.subject}
                                                </p>
                                                <p className="text-xs font-mono text-slate-400 mt-0.5">
                                                    #{ticket.ticketNumber.slice(-8)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-900">{empName}</p>
                                                <p className="text-xs text-slate-400">{ticket.employee?.details?.department}</p>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600">
                                                {CATEGORY_LABELS[ticket.category]}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
