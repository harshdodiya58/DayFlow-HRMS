"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    FileText, Plus, Edit2, Loader2, X, AlertCircle, 
    CheckCircle2, RefreshCw
} from "lucide-react"
import { useToast } from "@/components/Toast"

export default function AdminLeavePolicy() {
    const toast = useToast()
    const [policies, setPolicies] = useState([])
    const [loading, setLoading] = useState(true)
    const [csrfToken, setCsrfToken] = useState(null)
    const [initializing, setInitializing] = useState(false)
    
    // Modal state
    const [showForm, setShowForm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        leaveType: '',
        annualEntitlement: 12,
        maxCarryForward: 5,
        maxConsecutiveDays: 5,
        requiresApproval: true,
        minNoticeDays: 1,
        description: ''
    })
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchPolicies()
    }, [])

    const fetchPolicies = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/leave-policy')
            if (res.ok) {
                const data = await res.json()
                setPolicies(data.policies || [])
            }
        } catch (e) {
            toast.error('Failed to load leave policies')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenForm = (policy = null) => {
        if (policy) {
            setIsEditing(true)
            setFormData({
                leaveType: policy.leaveType,
                annualEntitlement: policy.annualEntitlement,
                maxCarryForward: policy.maxCarryForward,
                maxConsecutiveDays: policy.maxConsecutiveDays,
                requiresApproval: policy.requiresApproval,
                minNoticeDays: policy.minNoticeDays,
                description: policy.description || ''
            })
        } else {
            setIsEditing(false)
            setFormData({
                leaveType: '',
                annualEntitlement: 12,
                maxCarryForward: 5,
                maxConsecutiveDays: 5,
                requiresApproval: true,
                minNoticeDays: 1,
                description: ''
            })
        }
        setShowForm(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        try {
            const res = await fetch('/api/admin/leave-policy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({
                    ...formData,
                    annualEntitlement: parseInt(formData.annualEntitlement),
                    maxCarryForward: parseInt(formData.maxCarryForward),
                    maxConsecutiveDays: parseInt(formData.maxConsecutiveDays),
                    minNoticeDays: parseInt(formData.minNoticeDays),
                })
            })
            
            if (res.ok) {
                toast.success(isEditing ? 'Policy updated' : 'Policy created')
                setShowForm(false)
                fetchPolicies()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to save policy')
            }
        } catch (e) {
            toast.error('Network error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInitializeBalances = async () => {
        if (!confirm('This will create or update leave balances for ALL active employees for the current year. Proceed?')) return
        
        setInitializing(true)
        try {
            const currentYear = new Date().getFullYear()
            const res = await fetch('/api/admin/leave-policy', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({ year: currentYear })
            })
            
            if (res.ok) {
                const data = await res.json()
                toast.success(`Initialized: Created ${data.created}, Skipped ${data.skipped}`)
            } else {
                toast.error('Failed to initialize balances')
            }
        } catch (e) {
            toast.error('Error initializing balances')
        } finally {
            setInitializing(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leave Policies</h1>
                    <p className="text-slate-500 mt-1">Configure leave types, entitlements, and rules</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleInitializeBalances}
                        disabled={initializing}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {initializing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Sync Balances
                    </button>
                    <button
                        onClick={() => handleOpenForm()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Policy
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : policies.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No policies configured</h3>
                    <p className="text-slate-500 text-sm mb-6">Create leave policies to define how much time off employees get.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {policies.map(policy => (
                        <div key={policy.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenForm(policy)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <h3 className="font-bold text-slate-900 text-xl mb-1">{policy.leaveType}</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${policy.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {policy.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            
                            {policy.description && (
                                <p className="text-sm text-slate-500 mb-6">{policy.description}</p>
                            )}
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Annual Entitlement</span>
                                    <span className="font-bold text-slate-900">{policy.annualEntitlement} Days</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Max Carry Forward</span>
                                    <span className="font-bold text-slate-900">{policy.maxCarryForward} Days</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Max Consecutive Days</span>
                                    <span className="font-bold text-slate-900">{policy.maxConsecutiveDays} Days</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Notice Required</span>
                                    <span className="font-bold text-slate-900">{policy.minNoticeDays} Days</span>
                                </div>
                                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-600">
                                    {policy.requiresApproval ? (
                                        <><AlertCircle className="w-4 h-4 text-amber-500" /> Requires Manager Approval</>
                                    ) : (
                                        <><CheckCircle2 className="w-4 h-4 text-green-500" /> Auto-Approved</>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pb-28 overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-xl my-8 mt-16">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
                                <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Policy' : 'Create Policy'}</h2>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type * (e.g. CASUAL, SICK, PAID)</label>
                                    <input type="text" required disabled={isEditing} value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value.toUpperCase()})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Annual Entitlement (Days)</label>
                                        <input type="number" required min="0" value={formData.annualEntitlement} onChange={e => setFormData({...formData, annualEntitlement: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Max Carry Forward (Days)</label>
                                        <input type="number" required min="0" value={formData.maxCarryForward} onChange={e => setFormData({...formData, maxCarryForward: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Max Consecutive Days</label>
                                        <input type="number" required min="1" value={formData.maxConsecutiveDays} onChange={e => setFormData({...formData, maxConsecutiveDays: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Min Notice (Days)</label>
                                        <input type="number" required min="0" value={formData.minNoticeDays} onChange={e => setFormData({...formData, minNoticeDays: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <input type="checkbox" checked={formData.requiresApproval} onChange={e => setFormData({...formData, requiresApproval: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Requires Approval</p>
                                        <p className="text-xs text-slate-500">Manager must approve this leave type before it is granted</p>
                                    </div>
                                </label>
                                
                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex justify-center items-center gap-2 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Policy'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
