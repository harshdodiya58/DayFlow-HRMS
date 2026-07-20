"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, FileText, Palmtree, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/Toast"

export default function LeavePage() {
    const toast = useToast()
    const [leaves, setLeaves] = useState([])
    const [balances, setBalances] = useState([])
    const [holidays, setHolidays] = useState([])
    const [accruals, setAccruals] = useState([])
    
    const [showForm, setShowForm] = useState(false)
    const [showHolidaysModal, setShowHolidaysModal] = useState(false)
    const [formData, setFormData] = useState({
        type: '',
        startDate: '',
        endDate: '',
        reason: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [csrfToken, setCsrfToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/leaves')
            if (res.ok) {
                const data = await res.json()
                setLeaves(data.leaves || [])
                setBalances(data.balances || [])
                setHolidays(data.holidays || [])
                setAccruals(data.accruals || [])
                
                if (data.balances?.length > 0 && !formData.type) {
                    setFormData(prev => ({ ...prev, type: data.balances[0].leaveType }))
                }
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/leaves', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowForm(false)
                setFormData({ type: balances[0]?.leaveType || '', startDate: '', endDate: '', reason: '' })
                toast.success("Leave requested successfully")
                fetchData() // Refresh list and balances
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to apply for leave")
            }
        } catch (e) {
            console.error(e)
            toast.error("Error applying for leave")
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-100 text-emerald-700'
            case 'REJECTED': return 'bg-red-100 text-red-700'
            default: return 'bg-amber-100 text-amber-700'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="w-4 h-4" />
            case 'REJECTED': return <XCircle className="w-4 h-4" />
            default: return <Clock className="w-4 h-4" />
        }
    }

    // Filter upcoming holidays (from today onwards)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const upcomingHolidays = holidays
        .filter(h => new Date(h.date) >= today)
        .slice(0, 4) // Show next 4 holidays

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
                <p className="text-slate-500 mt-1">Manage your time off, view balances, and apply for leaves.</p>
            </div>

            {/* Balances Section */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    My Leave Balances ({new Date().getFullYear()})
                </h2>
                
                {loading ? (
                    <div className="h-32 bg-slate-100 animate-pulse rounded-2xl"></div>
                ) : balances.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-700 text-sm flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div>
                            <p className="font-bold mb-1">No leave balances found.</p>
                            <p>Your HR administrator hasn't assigned leave balances to you yet for this year. Please contact HR.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {balances.map(balance => {
                            const total = balance.entitled + balance.carryForward
                            const remaining = total - balance.used - balance.pending
                            const percentage = Math.max(0, Math.min(100, (remaining / total) * 100)) || 0
                            
                            return (
                                <div key={balance.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-slate-700">{balance.leaveType}</h3>
                                        <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">
                                            {remaining} left
                                        </div>
                                    </div>
                                    
                                    <div className="w-full bg-slate-100 h-2 rounded-full mb-3 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${percentage < 20 ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Total: {total}</span>
                                        <span>Used: {balance.used}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Accruals History Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Accruals History
                    </h2>
                </div>
                <div className="p-6">
                    {accruals.length === 0 ? (
                        <div className="text-slate-500 text-center py-8">No accrual history available.</div>
                    ) : (
                        <div className="space-y-4">
                            {accruals.map((acc) => (
                                <div key={acc.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                                    <div>
                                        <h4 className="font-bold text-slate-800">{acc.leaveType}</h4>
                                        <p className="text-sm text-slate-500">{acc.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-green-600">+{acc.accruedAmount}</span>
                                        <p className="text-xs text-slate-400">{new Date(acc.transactionDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content (History + Form) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Apply Leave Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-blue-500/20">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Calendar className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-bold opacity-90 mb-2">Need a break?</h2>
                                <p className="text-blue-100 max-w-sm">Apply for leave easily. Just make sure to provide sufficient notice based on the policy.</p>
                            </div>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                disabled={balances.length === 0}
                                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                                {showForm ? 'Cancel Request' : 'Apply Leave'}
                            </button>
                        </div>
                    </div>

                    {/* Apply Form */}
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-blue-100 shadow-md p-6"
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-4">New Leave Request</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-2">Leave Type *</label>
                                        <select
                                            required
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-900"
                                        >
                                            <option value="">Select Type</option>
                                            {balances.map(b => (
                                                <option key={b.leaveType} value={b.leaveType}>{b.leaveType} ({b.entitled + b.carryForward - b.used - b.pending} left)</option>
                                            ))}
                                            <option value="UNPAID">UNPAID LEAVE</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-2">Start Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-2">End Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900 font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-2">Reason *</label>
                                    <textarea
                                        required
                                        rows="3"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="State your reason clearly..."
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900 placeholder:text-slate-400 font-medium"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !formData.type}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Request'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* History */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            Recent Leave Requests
                        </h3>
                        
                        {loading ? (
                            <div className="h-40 bg-slate-50 animate-pulse rounded-xl"></div>
                        ) : leaves.length > 0 ? (
                            <div className="space-y-4">
                                {leaves.map(leave => {
                                    const start = new Date(leave.startDate).toLocaleDateString()
                                    const end = new Date(leave.endDate).toLocaleDateString()
                                    const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1

                                    return (
                                        <div key={leave.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700 shadow-sm">{leave.type}</span>
                                                        <span className="text-slate-400 text-xs font-medium">• {days} Day{days > 1 ? 's' : ''}</span>
                                                    </div>
                                                    <h4 className="font-semibold text-slate-900 text-sm">{start} - {end}</h4>
                                                </div>
                                                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(leave.status)}`}>
                                                    {getStatusIcon(leave.status)}
                                                    {leave.status}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-xs mt-2 line-clamp-2">{leave.reason}</p>
                                            
                                            {leave.adminComments && (
                                                <div className="mt-3 p-2 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-100">
                                                    <strong>HR:</strong> {leave.adminComments}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-500 text-sm">No leave history found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (Holidays) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Palmtree className="w-5 h-5 text-orange-500" />
                            Upcoming Holidays
                        </h3>
                        
                        {loading ? (
                            <div className="space-y-3">
                                {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl"></div>)}
                            </div>
                        ) : upcomingHolidays.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingHolidays.map(holiday => (
                                    <div key={holiday.id} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="flex flex-col items-center justify-center bg-orange-50 text-orange-600 w-12 h-12 rounded-lg shrink-0">
                                            <span className="text-[10px] font-bold uppercase leading-none mb-1">
                                                {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-black leading-none">
                                                {new Date(holiday.date).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{holiday.name}</h4>
                                            <div className="flex gap-1 mt-1">
                                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{holiday.type}</span>
                                                {holiday.isOptional && (
                                                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">OPTIONAL</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-xl">
                                <p className="text-slate-500 text-sm">No upcoming holidays scheduled.</p>
                            </div>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                            <button 
                                onClick={() => setShowHolidaysModal(true)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                View Full Calendar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showHolidaysModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHolidaysModal(false)}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                        <Palmtree className="w-6 h-6 text-orange-500" />
                                        Company Holidays ({new Date().getFullYear()})
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">Full list of scheduled holidays for the year</p>
                                </div>
                                <button 
                                    onClick={() => setShowHolidaysModal(false)}
                                    className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <div className="space-y-4">
                                    {holidays.map(holiday => {
                                        const isPast = new Date(holiday.date) < new Date(new Date().setHours(0,0,0,0));
                                        return (
                                            <div key={holiday.id} className={`flex gap-4 p-4 rounded-2xl border ${isPast ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-orange-200 hover:shadow-md transition-all'}`}>
                                                <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl shrink-0 ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-orange-50 text-orange-600'}`}>
                                                    <span className="text-[11px] font-bold uppercase leading-none mb-1">
                                                        {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                                                    </span>
                                                    <span className="text-xl font-black leading-none">
                                                        {new Date(holiday.date).getDate()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`font-bold text-lg line-clamp-1 ${isPast ? 'text-slate-600' : 'text-slate-900'}`}>{holiday.name}</h4>
                                                        <div className="flex gap-2">
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">{holiday.type}</span>
                                                            {holiday.isOptional && (
                                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded uppercase tracking-wider">OPTIONAL</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {holiday.description && (
                                                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{holiday.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {holidays.length === 0 && (
                                        <div className="text-center py-12">
                                            <p className="text-slate-500">No holidays have been scheduled for this year yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
