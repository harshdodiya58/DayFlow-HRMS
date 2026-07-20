"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2, Mail, Phone, ExternalLink, Calendar, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useToast } from "@/components/Toast"

const COLUMNS = [
    { id: 'NEW', label: 'New', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'SCREENING', label: 'Screening', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'INTERVIEW', label: 'Interview', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'OFFER', label: 'Offer Sent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'HIRED', label: 'Hired', color: 'bg-green-50 text-green-700 border-green-200' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' }
]

export default function ApplicationPipelinePage() {
    const { jobId } = useParams()
    const toast = useToast()
    
    const [job, setJob] = useState(null)
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPipeline()
    }, [jobId])

    async function fetchPipeline() {
        try {
            const res = await fetch(`/api/admin/recruitment/jobs/${jobId}/applications`)
            if (res.ok) {
                const data = await res.json()
                setJob(data.job)
                setApplications(data.applications || [])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (appId, newStatus) => {
        // Optimistic UI update
        const originalApps = [...applications]
        setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: newStatus } : app))
        
        try {
            const res = await fetch(`/api/admin/recruitment/applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (!res.ok) throw new Error('Failed to update')
            toast?.success('Status updated')
        } catch (error) {
            setApplications(originalApps) // Revert on failure
            toast?.error('Failed to update status')
        }
    }

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
    }

    if (!job) {
        return <div className="text-center py-20">Job not found</div>
    }

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center gap-4">
                <Link href="/admin/recruitment" className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{job.title} Pipeline</h1>
                    <p className="text-slate-500">{applications.length} Candidates</p>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 h-full items-start min-w-max px-2">
                    {COLUMNS.map(column => {
                        const colApps = applications.filter(app => app.status === column.id)
                        
                        return (
                            <div key={column.id} className="w-80 flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200/60 max-h-full">
                                <div className={`p-4 border-b rounded-t-2xl font-bold flex justify-between items-center ${column.color}`}>
                                    <span>{column.label}</span>
                                    <span className="bg-white/50 px-2 py-0.5 rounded-full text-sm">{colApps.length}</span>
                                </div>
                                
                                <div className="p-3 overflow-y-auto flex-1 space-y-3">
                                    <AnimatePresence>
                                        {colApps.map(app => (
                                            <motion.div
                                                key={app.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group relative"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-slate-900">{app.candidateName}</h4>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white shadow-sm border border-slate-100 rounded-lg p-1 z-10">
                                                        {/* Status change shortcuts */}
                                                        <select 
                                                            className="text-xs outline-none bg-transparent"
                                                            value={app.status}
                                                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                        >
                                                            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5 mb-4">
                                                    <a href={`mailto:${app.candidateEmail}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span className="truncate">{app.candidateEmail}</span>
                                                    </a>
                                                    {app.candidatePhone && (
                                                        <a href={`tel:${app.candidatePhone}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600">
                                                            <Phone className="w-3.5 h-3.5" />
                                                            {app.candidatePhone}
                                                        </a>
                                                    )}
                                                </div>

                                                <div className="flex gap-2 text-xs font-medium">
                                                    {app.resumeUrl && (
                                                        <a href={app.resumeUrl} target="_blank" className="flex-1 text-center bg-blue-50 text-blue-700 py-1.5 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1">
                                                            <ExternalLink className="w-3 h-3" /> Resume
                                                        </a>
                                                    )}
                                                    <button className="flex-1 text-center bg-slate-100 text-slate-700 py-1.5 rounded-lg hover:bg-slate-200">
                                                        Details
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    
                                    {colApps.length === 0 && (
                                        <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                            No candidates
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
