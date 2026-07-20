'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Save, Plus, AlertCircle, Percent } from 'lucide-react'

export default function StatutoryConfigPage() {
    const [configs, setConfigs] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        type: 'PF',
        employeeContribution: '',
        employerContribution: '',
        ceiling: '',
        state: ''
    })

    useEffect(() => {
        fetchConfigs()
    }, [])

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/admin/compliance/statutory')
            const data = await res.json()
            if (data.success) {
                setConfigs(data.configs)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Failed to fetch statutory configs')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            const res = await fetch('/api/admin/compliance/statutory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (data.success) {
                setShowForm(false)
                fetchConfigs()
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Failed to save configuration')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Statutory Configurations</h1>
                    <p className="text-white/60 mt-2">Manage rules for PF, ESI, PT, and TDS calculations.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    New Rule
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {showForm && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl"
                >
                    <h2 className="text-xl font-bold text-white mb-6">Create Statutory Rule</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-white/70 font-medium mb-2">Type</label>
                                <select 
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="PF">Provident Fund (PF)</option>
                                    <option value="ESI">ESI</option>
                                    <option value="PT">Professional Tax (PT)</option>
                                    <option value="TDS">TDS (Income Tax)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-white/70 font-medium mb-2">Employee Contribution (%)</label>
                                <div className="relative">
                                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input 
                                        type="number" step="0.01"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                        value={formData.employeeContribution}
                                        onChange={(e) => setFormData({...formData, employeeContribution: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-white/70 font-medium mb-2">Employer Contribution (%)</label>
                                <div className="relative">
                                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input 
                                        type="number" step="0.01"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                        value={formData.employerContribution}
                                        onChange={(e) => setFormData({...formData, employerContribution: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-white/70 font-medium mb-2">Wage Ceiling (Optional)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                                    <input 
                                        type="number"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                        value={formData.ceiling}
                                        placeholder="e.g. 15000 for PF"
                                        onChange={(e) => setFormData({...formData, ceiling: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 text-white/70 hover:bg-white/5 rounded-xl font-medium transition"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
                            >
                                {saving ? <span className="animate-spin text-xl">⏳</span> : <Save className="w-5 h-5" />}
                                Save Rule
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />
                    ))
                ) : (
                    configs.map(config => (
                        <div key={config.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between hover:bg-white/10 transition">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Calculator className="w-5 h-5 text-blue-400" />
                                        {config.type}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {config.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="space-y-2 text-white/70 text-sm">
                                    <div className="flex justify-between">
                                        <span>Employee Contribution:</span>
                                        <span className="font-medium text-white">{config.employeeContribution}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Employer Contribution:</span>
                                        <span className="font-medium text-white">{config.employerContribution}%</span>
                                    </div>
                                    {config.ceiling && (
                                        <div className="flex justify-between">
                                            <span>Wage Ceiling:</span>
                                            <span className="font-medium text-white">₹{config.ceiling}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/40">
                                Last updated: {new Date(config.updatedAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
