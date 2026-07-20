"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Plus, Building2, User, Loader2, ArrowLeft, X } from "lucide-react"
import { useToast } from "@/components/Toast"
import Link from "next/link"

export default function DepartmentsSettings() {
    const toast = useToast()
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [csrfToken, setCsrfToken] = useState(null)
    const [employees, setEmployees] = useState([]) // For selecting headId
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        headId: "",
        parentId: ""
    })

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [deptRes, empRes] = await Promise.all([
                fetch('/api/admin/departments'),
                fetch('/api/admin/employees?activeOnly=true')
            ])
            
            if (deptRes.ok) {
                const data = await deptRes.json()
                setDepartments(data.departments || [])
            }
            if (empRes.ok) {
                const data = await empRes.json()
                setEmployees(data.employees || [])
            }
        } catch (e) {
            toast.error("Failed to fetch data")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        
        try {
            const payload = { ...formData }
            if (payload.headId) payload.headId = parseInt(payload.headId)
            else delete payload.headId
            
            if (payload.parentId) payload.parentId = parseInt(payload.parentId)
            else delete payload.parentId

            const res = await fetch('/api/admin/departments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify(payload)
            })
            
            if (res.ok) {
                toast.success("Department created successfully")
                setShowForm(false)
                setFormData({ name: "", code: "", description: "", headId: "", parentId: "" })
                fetchData()
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to create department")
            }
        } catch (e) {
            toast.error("An error occurred")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/settings" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Departments</h1>
                        <p className="text-slate-500 mt-1">Manage organizational structure and departments</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 w-full md:w-auto"
                >
                    <Plus className="w-4 h-4" />
                    Add Department
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : departments.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No departments found</h3>
                    <p className="text-slate-500 text-sm mb-6">Get started by creating your first department.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((dept) => (
                        <div key={dept.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-blue-500" />
                                        {dept.name}
                                    </h3>
                                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-2 inline-block">
                                        {dept.code}
                                    </span>
                                </div>
                            </div>
                            
                            <p className="text-sm text-slate-600 mb-6 line-clamp-2 min-h-[40px]">
                                {dept.description || "No description provided."}
                            </p>
                            
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-2"><User className="w-4 h-4" /> Head</span>
                                    <span className="font-medium text-slate-900">
                                        {dept.head ? `${dept.head.details.firstName} ${dept.head.details.lastName}` : "Not Assigned"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-2"><Users className="w-4 h-4" /> Employees</span>
                                    <span className="font-bold text-slate-900 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                        {dept._count?.employees || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Department Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pb-28 overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 mt-16">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
                                <h2 className="text-xl font-bold text-slate-900">New Department</h2>
                                <button type="button" onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Department Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors" 
                                        placeholder="e.g. Engineering" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Department Code *</label>
                                    <input 
                                        type="text" 
                                        required
                                        maxLength={10}
                                        value={formData.code} 
                                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors uppercase" 
                                        placeholder="e.g. ENG-01" 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea 
                                        rows={3} 
                                        value={formData.description} 
                                        onChange={e => setFormData({...formData, description: e.target.value})} 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors" 
                                        placeholder="Brief description of the department's function..." 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Department Head</label>
                                    <select 
                                        value={formData.headId} 
                                        onChange={e => setFormData({...formData, headId: e.target.value})} 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white transition-colors"
                                    >
                                        <option value="">-- Select Employee --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.details?.firstName} {emp.details?.lastName} ({emp.employeeId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex justify-center items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Create Department
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
