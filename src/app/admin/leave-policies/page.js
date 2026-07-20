'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Play, Plus, AlertCircle, Calendar } from 'lucide-react'

export default function LeavePoliciesPage() {
    const [policies, setPolicies] = useState([])
    const [loading, setLoading] = useState(true)
    const [runningCron, setRunningCron] = useState(false)
    const [cronMessage, setCronMessage] = useState('')
    
    // Form State
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        leaveType: 'CASUAL',
        annualEntitlement: 12,
        accrualRatePerMonth: 1.0,
        maxCarryForward: 5,
        isEncashable: false,
        requiresApproval: true
    })

    useEffect(() => {
        fetchPolicies()
    }, [])

    const fetchPolicies = async () => {
        try {
            const res = await fetch('/api/admin/leave-policies')
            const data = await res.json()
            if (data.success) {
                setPolicies(data.policies)
            }
        } catch (error) {
            console.error('Failed to fetch policies', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSavePolicy = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/admin/leave-policies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowForm(false)
                fetchPolicies()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleTriggerAccruals = async () => {
        if (!confirm('Are you sure you want to trigger the monthly accrual cron job manually?')) return
        setRunningCron(true)
        setCronMessage('')
        try {
            const res = await fetch('/api/cron/accrue-leaves', { method: 'POST' })
            const data = await res.json()
            setCronMessage(data.message || data.error)
        } catch (error) {
            setCronMessage('Failed to trigger cron')
        } finally {
            setRunningCron(false)
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Leave Policies & Accruals</h1>
                    <p className="text-white/60 mt-2">Manage organizational leave limits and automated credit cycles.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleTriggerAccruals}
                        disabled={runningCron}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition disabled:opacity-50"
                    >
                        {runningCron ? <span className="animate-spin">⏳</span> : <Play className="w-5 h-5" />}
                        Run Accrual Job
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        New Policy
                    </button>
                </div>
            </div>

            {cronMessage && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    {cronMessage}
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSavePolicy} className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                    <h3 className="text-xl font-bold text-white mb-4">Configure Leave Policy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-white/70 font-medium mb-2">Leave Type</label>
                            <select 
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.leaveType}
                                onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                            >
                                <option value="CASUAL">Casual Leave (CL)</option>
                                <option value="SICK">Sick Leave (SL)</option>
                                <option value="EARNED">Earned Leave (EL)</option>
                                <option value="MATERNITY">Maternity</option>
                                <option value="PATERNITY">Paternity</option>
                                <option value="UNPAID">Loss of Pay (UNPAID)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-white/70 font-medium mb-2">Annual Entitlement (Days)</label>
                            <input 
                                type="number" required
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.annualEntitlement}
                                onChange={(e) => setFormData({...formData, annualEntitlement: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-white/70 font-medium mb-2">Monthly Accrual Rate</label>
                            <input 
                                type="number" step="0.5" required
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.accrualRatePerMonth}
                                onChange={(e) => setFormData({...formData, accrualRatePerMonth: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-white/70 font-medium mb-2">Max Carry Forward (Yearly)</label>
                            <input 
                                type="number" required
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.maxCarryForward}
                                onChange={(e) => setFormData({...formData, maxCarryForward: e.target.value})}
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-8">
                            <input 
                                type="checkbox" id="encashable"
                                className="w-5 h-5 accent-blue-500"
                                checked={formData.isEncashable}
                                onChange={(e) => setFormData({...formData, isEncashable: e.target.checked})}
                            />
                            <label htmlFor="encashable" className="text-white font-medium">Encashable during Settlement?</label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-white/70 hover:bg-white/5 rounded-xl font-medium transition">Cancel</button>
                        <button type="submit" className="bg-white text-black px-8 py-2 rounded-xl font-bold hover:bg-gray-200 transition">Save Policy</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />)
                ) : (
                    policies.map(policy => (
                        <div key={policy.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-blue-400" />
                                    {policy.leaveType}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${policy.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {policy.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="space-y-3 text-sm text-white/70">
                                <div className="flex justify-between">
                                    <span>Annual Limit:</span>
                                    <span className="font-bold text-white">{policy.annualEntitlement} Days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Monthly Accrual:</span>
                                    <span className="font-bold text-white">{policy.accrualRatePerMonth} Days/mo</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Max Carry Fwd:</span>
                                    <span className="font-bold text-white">{policy.maxCarryForward} Days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Encashable:</span>
                                    <span className={`font-bold ${policy.isEncashable ? 'text-green-400' : 'text-red-400'}`}>
                                        {policy.isEncashable ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
