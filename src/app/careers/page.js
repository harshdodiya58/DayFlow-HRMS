"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Briefcase, MapPin, Building, Search, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

export default function CareersPage() {
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        async function fetchJobs() {
            try {
                const res = await fetch('/api/careers/jobs')
                if (res.ok) {
                    const data = await res.json()
                    setJobs(data.jobs)
                }
            } catch (error) {
                console.error("Failed to fetch jobs:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchJobs()
    }, [])

    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Hero Section */}
            <div className="bg-blue-600 text-white py-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight"
                    >
                        Join Our Team
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-blue-100 max-w-2xl mx-auto mb-10"
                    >
                        Build the future of HR technology with us. We're looking for passionate individuals to help us scale DayFlow globally.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-xl mx-auto relative"
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Search by role, department, or location..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-full text-slate-900 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </motion.div>
                </div>
            </div>

            {/* Jobs List */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">Open Positions ({filteredJobs.length})</h2>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                        <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No open positions found</h3>
                        <p className="text-slate-500">Try adjusting your search criteria or check back later.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredJobs.map((job, index) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/careers/${job.id}`}>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                                                {job.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Building className="w-4 h-4 text-slate-400" />
                                                    {job.department?.name || 'General'}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4 text-slate-400" />
                                                    {job.location || 'Remote'}
                                                </div>
                                                <div className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium text-xs">
                                                    {job.employmentType.replace('_', ' ')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-blue-600 font-medium whitespace-nowrap">
                                            View Details
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-8 text-center">
                <p>&copy; {new Date().getFullYear()} DayFlow HRMS. All rights reserved.</p>
            </footer>
        </div>
    )
}
