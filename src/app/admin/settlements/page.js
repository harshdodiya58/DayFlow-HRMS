'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Download, CheckCircle, Clock } from 'lucide-react'

export default function SettlementsPage() {
    const [settlements, setSettlements] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchSettlements()
    }, [])

    const fetchSettlements = async () => {
        try {
            const res = await fetch('/api/admin/settlements')
            const data = await res.json()
            if (data.success) {
                setSettlements(data.settlements)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Failed to fetch settlements')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Full & Final Settlements</h1>
                    <p className="text-white/60 mt-2">Manage offboarding employee final payouts and dues.</p>
                </div>
                <div className="bg-blue-500/20 text-blue-400 p-3 rounded-xl">
                    <Calculator className="w-6 h-6" />
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl">
                    {error}
                </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-white/60 uppercase text-xs tracking-wider">
                                <th className="p-4 font-bold">Employee</th>
                                <th className="p-4 font-bold">Earnings (Leave, Gratuity, Bonus)</th>
                                <th className="p-4 font-bold">Deductions (NP, Assets, Loan)</th>
                                <th className="p-4 font-bold">Net Settlement</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold">Processed By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/10 rounded w-32"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/10 rounded w-32"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/10 rounded w-16"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                                    </tr>
                                ))
                            ) : settlements.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-white/40">
                                        No settlements processed yet.
                                    </td>
                                </tr>
                            ) : (
                                settlements.map((s) => (
                                    <tr key={s.id} className="hover:bg-white/5 transition">
                                        <td className="p-4">
                                            <div className="text-white font-bold">{s.employee?.firstName} {s.employee?.lastName}</div>
                                            <div className="text-white/40 text-xs">{s.employee?.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-green-400 font-medium">
                                                ₹{(s.leaveEncashment + s.gratuity + s.bonus).toLocaleString('en-IN')}
                                            </div>
                                            <div className="text-white/40 text-xs">
                                                L: ₹{s.leaveEncashment} | G: ₹{s.gratuity} | B: ₹{s.bonus}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-red-400 font-medium">
                                                ₹{(s.noticePeriodDeduction + s.assetDamageDeduction + s.loanBalance).toLocaleString('en-IN')}
                                            </div>
                                            <div className="text-white/40 text-xs">
                                                NP: ₹{s.noticePeriodDeduction} | Ast: ₹{s.assetDamageDeduction} | Ln: ₹{s.loanBalance}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-blue-400 font-bold text-lg">
                                                ₹{s.totalAmount.toLocaleString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                                s.status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                                                s.status === 'PROCESSED' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {s.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-white/70">{s.processor?.firstName} {s.processor?.lastName}</div>
                                            <div className="text-white/40 text-xs">
                                                {new Date(s.processedAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
