"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Briefcase, MapPin, Search, Users, ExternalLink, Calendar, MoreVertical, Loader2 } from "lucide-react"
import Link from "next/link"

export default function RecruitmentDashboard() {
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchJobs()
    }, [])

    async function fetchJobs() {
        try {
            const res = await fetch('/api/admin/recruitment/jobs')
            const data = await res.json()
            if (data.success) {
                setJobs(data.jobs)
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return 'bg-green-100 text-green-700'
            case 'DRAFT': return 'bg-slate-100 text-slate-700'
            case 'ON_HOLD': return 'bg-amber-100 text-amber-700'
            case 'CLOSED': return 'bg-red-100 text-red-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Recruitment</h1>
                    <p className="text-slate-500">Manage job postings and applications</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link 
                        href="/careers" target="_blank"
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Careers Page
                    </Link>
                    <Link 
                        href="/admin/recruitment/new"
                        className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create Job
                    </Link>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-400 ml-2" />
                <input 
                    type="text" 
                    placeholder="Search jobs..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Job Postings</h3>
                    <p className="text-slate-500 mb-6">You haven't created any job postings yet.</p>
                    <Link href="/admin/recruitment/new" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700">
                        Create Your First Job
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <motion.div 
                            key={job.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(job.status)}`}>
                                        {job.status}
                                    </span>
                                    <button className="text-slate-400 hover:text-slate-600">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                                    {job.title}
                                </h3>
                                <div className="space-y-2 mt-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-slate-400" />
                                        {job.department?.name || 'General'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        {job.location || 'Remote'}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    {job._count?.applications || 0} Applicants
                                </div>
                                <Link 
                                    href={`/admin/recruitment/${job.id}`}
                                    className="text-sm font-bold text-blue-600 hover:text-blue-700"
                                >
                                    View Pipeline →
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
