"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, UserMinus, Calendar, Search, MoreVertical, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function OffboardingDashboard() {
    const [processes, setProcesses] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const res = await fetch('/api/admin/offboarding')
            const data = await res.json()
            if (data.success) {
                setProcesses(data.processes)
            }
        } catch (error) {
            console.error("Failed to fetch offboarding data:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredProcesses = processes.filter(p => 
        p.employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusColor = (status) => {
        switch (status) {
            case 'INITIATED': return 'bg-blue-100 text-blue-700'
            case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700'
            case 'COMPLETED': return 'bg-green-100 text-green-700'
            case 'CANCELLED': return 'bg-slate-100 text-slate-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Offboarding</h1>
                    <p className="text-slate-500">Manage employee exits and clearances</p>
                </div>
                <Link 
                    href="/admin/offboarding/new"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Initiate Offboarding
                </Link>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-400 ml-2" />
                <input 
                    type="text" 
                    placeholder="Search by employee name..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : filteredProcesses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <UserMinus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Active Offboardings</h3>
                    <p className="text-slate-500 mb-6">There are no ongoing offboarding processes at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProcesses.map((process) => (
                        <motion.div 
                            key={process.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(process.status)}`}>
                                        {process.status.replace('_', ' ')}
                                    </span>
                                    <button className="text-slate-400 hover:text-slate-600">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    {process.employee?.firstName} {process.employee?.lastName}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">{process.employee?.email}</p>
                                
                                <div className="space-y-2 mt-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        LWD: {new Date(process.lastWorkingDay).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-slate-400" />
                                        Type: {process.type}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 border-t border-slate-100 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Clearance</span>
                                    {process.clearanceCompleted ? 
                                        <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 className="w-4 h-4" /> Done</span> : 
                                        <span className="text-slate-400">Pending</span>
                                    }
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Exit Interview</span>
                                    {process.exitInterviewCompleted ? 
                                        <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 className="w-4 h-4" /> Done</span> : 
                                        <span className="text-slate-400">Pending</span>
                                    }
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
