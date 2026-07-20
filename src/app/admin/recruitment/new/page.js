"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Save, Loader2, IndianRupee, MapPin, Briefcase } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/Toast"

export default function CreateJobPage() {
    const router = useRouter()
    const toast = useToast()
    const [departments, setDepartments] = useState([])
    const [saving, setSaving] = useState(false)
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        departmentId: '',
        location: '',
        employmentType: 'FULL_TIME',
        experienceMin: '',
        experienceMax: '',
        salaryRangeMin: '',
        salaryRangeMax: '',
        skills: '',
        status: 'OPEN'
    })

    useEffect(() => {
        fetchDepartments()
    }, [])

    async function fetchDepartments() {
        try {
            const res = await fetch('/api/admin/departments')
            if (res.ok) {
                const data = await res.json()
                setDepartments(data.departments || [])
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        
        try {
            // Process skills from comma separated to array
            const processedData = {
                ...formData,
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : []
            }
            
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch('/api/admin/recruitment/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify(processedData)
            })
            
            const data = await res.json()
            if (data.success) {
                toast?.success('Job created successfully')
                router.push('/admin/recruitment')
            } else {
                toast?.error(data.error || 'Failed to create job')
            }
        } catch (error) {
            toast?.error('An unexpected error occurred')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Link href="/admin/recruitment" className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Create Job Posting</h1>
                    <p className="text-slate-500">Publish a new open role to the careers page</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">
                    {/* Basic Info */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-6">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                                <input 
                                    type="text" required name="title"
                                    value={formData.title} onChange={handleChange}
                                    placeholder="e.g. Senior Frontend Engineer"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                <select 
                                    name="departmentId"
                                    value={formData.departmentId} onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">Select Department...</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                                <select 
                                    name="employmentType" required
                                    value={formData.employmentType} onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="FULL_TIME">Full Time</option>
                                    <option value="PART_TIME">Part Time</option>
                                    <option value="CONTRACT">Contract</option>
                                    <option value="INTERN">Internship</option>
                                </select>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                <input 
                                    type="text" name="location"
                                    value={formData.location} onChange={handleChange}
                                    placeholder="e.g. Remote, India or Bangalore"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Requirements & Compensation */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-6">Requirements & Compensation</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Min Experience (Yrs)</label>
                                    <input 
                                        type="number" name="experienceMin" min="0" step="1"
                                        value={formData.experienceMin} onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Experience</label>
                                    <input 
                                        type="number" name="experienceMax" min="0" step="1"
                                        value={formData.experienceMax} onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Min Salary (Annual)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="number" name="salaryRangeMin" min="0" step="1000"
                                            value={formData.salaryRangeMin} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Salary</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="number" name="salaryRangeMax" min="0" step="1000"
                                            value={formData.salaryRangeMax} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Skills (Comma separated)</label>
                                <input 
                                    type="text" name="skills"
                                    value={formData.skills} onChange={handleChange}
                                    placeholder="e.g. React, Node.js, TypeScript"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Job Description */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-6">Job Description</h2>
                        <div>
                            <textarea 
                                name="description" required rows="10"
                                value={formData.description} onChange={handleChange}
                                placeholder="Describe the role, responsibilities, and what you're looking for..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            ></textarea>
                        </div>
                    </section>
                </div>
                
                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-slate-700">Status:</label>
                        <select 
                            name="status"
                            value={formData.status} onChange={handleChange}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold"
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="OPEN">Open (Published)</option>
                            <option value="ON_HOLD">On Hold</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/recruitment" className="px-5 py-2.5 text-slate-600 font-medium hover:text-slate-900 transition-colors">
                            Cancel
                        </Link>
                        <button 
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Publish Job
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
