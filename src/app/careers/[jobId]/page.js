"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Building, MapPin, Briefcase, IndianRupee, Loader2, Send, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useToast } from "@/components/Toast"

export default function JobDetailPage() {
    const { jobId } = useParams()
    const toast = useToast()
    
    const [job, setJob] = useState(null)
    const [loading, setLoading] = useState(true)
    
    // Application Form State
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [formData, setFormData] = useState({
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        resumeUrl: '',
        coverLetterUrl: '',
        source: 'WEBSITE'
    })

    useEffect(() => {
        async function fetchJob() {
            try {
                const res = await fetch(`/api/careers/jobs/${jobId}`)
                if (res.ok) {
                    const data = await res.json()
                    setJob(data.job)
                } else {
                    setJob(null)
                }
            } catch (error) {
                console.error("Failed to fetch job:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchJob()
    }, [jobId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        
        try {
            const res = await fetch('/api/careers/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobPostingId: parseInt(jobId),
                    ...formData
                })
            })
            
            const data = await res.json()
            if (data.success) {
                setSubmitted(true)
                toast?.success('Application submitted successfully!')
            } else {
                toast?.error(data.error || 'Failed to submit application')
            }
        } catch (error) {
            toast?.error('An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Job Not Found</h1>
                <p className="text-slate-500 mb-8 max-w-md">This position may have been closed or the URL is incorrect.</p>
                <Link href="/careers" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                    View All Open Positions
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 py-8 px-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/careers" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Careers
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">{job.title}</h1>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                            <Building className="w-4 h-4 text-slate-500" />
                            {job.department?.name || 'General'}
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                            <MapPin className="w-4 h-4 text-slate-500" />
                            {job.location || 'Remote'}
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                            <Briefcase className="w-4 h-4 text-slate-500" />
                            {job.employmentType.replace('_', ' ')}
                        </div>
                        {(job.salaryRangeMin || job.salaryRangeMax) && (
                            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">
                                <IndianRupee className="w-4 h-4" />
                                {job.salaryRangeMin ? (job.salaryRangeMin / 100000).toFixed(1) + 'L' : ''} 
                                {job.salaryRangeMin && job.salaryRangeMax ? ' - ' : ''}
                                {job.salaryRangeMax ? (job.salaryRangeMax / 100000).toFixed(1) + 'L' : ''}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Job Description */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">About the Role</h2>
                        <div className="prose prose-slate max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }} />
                        </div>

                        {job.skills && job.skills.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills.map(skill => (
                                        <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Apply Section */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        {!showForm && !submitted ? (
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Interested?</h3>
                                <p className="text-sm text-slate-500 mb-6">Take the next step in your career.</p>
                                <button 
                                    onClick={() => setShowForm(true)}
                                    className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                                >
                                    Apply Now
                                </button>
                            </div>
                        ) : submitted ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-green-50 p-8 rounded-3xl border border-green-200 text-center"
                            >
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-green-900 mb-2">Application Received!</h3>
                                <p className="text-green-700 text-sm">Thank you for applying. Our team will review your profile and get back to you soon.</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900">Apply for this role</h3>
                                    <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                        <input 
                                            type="text" required
                                            name="candidateName"
                                            value={formData.candidateName} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                                        <input 
                                            type="email" required
                                            name="candidateEmail"
                                            value={formData.candidateEmail} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                        <input 
                                            type="tel"
                                            name="candidatePhone"
                                            value={formData.candidatePhone} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Resume URL (LinkedIn, Drive, etc) *</label>
                                        <input 
                                            type="url" required
                                            name="resumeUrl"
                                            value={formData.resumeUrl} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        Submit Application
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
