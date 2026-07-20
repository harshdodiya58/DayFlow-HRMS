'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Save, UploadCloud, AlertCircle } from 'lucide-react'

export default function TaxDeclarationsPage() {
    const [declarations, setDeclarations] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        financialYear: '2026-2027',
        section80C: '',
        section80D: '',
        hra: '',
        otherDeductions: ''
    })

    useEffect(() => {
        fetchDeclarations()
    }, [])

    const fetchDeclarations = async () => {
        try {
            const res = await fetch('/api/dashboard/tax-declarations')
            const data = await res.json()
            if (data.success) {
                setDeclarations(data.declarations)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Failed to fetch tax declarations')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            const res = await fetch('/api/dashboard/tax-declarations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (data.success) {
                setShowForm(false)
                fetchDeclarations()
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Failed to submit tax declaration')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Tax Declarations</h1>
                    <p className="text-white/60 mt-2">Submit your investment declarations to optimize TDS deductions.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                >
                    <UploadCloud className="w-5 h-5" />
                    New Declaration
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
                    <h2 className="text-xl font-bold text-white mb-6">Submit Declaration for {formData.financialYear}</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-white/70 font-medium mb-2">Section 80C (Max ₹1,50,000)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                                    <input 
                                        type="number"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                        value={formData.section80C}
                                        placeholder="PPF, ELSS, LIC, etc."
                                        onChange={(e) => setFormData({...formData, section80C: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-white/70 font-medium mb-2">Section 80D (Medical)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                                    <input 
                                        type="number"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                        value={formData.section80D}
                                        placeholder="Health Insurance"
                                        onChange={(e) => setFormData({...formData, section80D: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-white/70 font-medium mb-2">HRA (Rent Paid)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                                    <input 
                                        type="number"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                        value={formData.hra}
                                        placeholder="Yearly Rent"
                                        onChange={(e) => setFormData({...formData, hra: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-white/70 font-medium mb-2">Other Deductions</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                                    <input 
                                        type="number"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                        value={formData.otherDeductions}
                                        placeholder="NPS, Education Loan Int, etc."
                                        onChange={(e) => setFormData({...formData, otherDeductions: e.target.value})}
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
                                Submit
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">Past Declarations</h3>
                {loading ? (
                    <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                ) : declarations.length === 0 ? (
                    <div className="text-white/40 text-center py-10 bg-white/5 rounded-3xl border border-white/10">
                        No declarations found.
                    </div>
                ) : (
                    declarations.map(dec => (
                        <div key={dec.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-white/10 transition">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">FY {dec.financialYear}</h4>
                                    <div className="text-sm text-white/60 flex gap-4 mt-1">
                                        <span>80C: ₹{dec.section80C}</span>
                                        <span>80D: ₹{dec.section80D}</span>
                                        <span>HRA: ₹{dec.hra}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    dec.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                    dec.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                    {dec.status}
                                </span>
                                <span className="text-xs text-white/40">
                                    {new Date(dec.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
