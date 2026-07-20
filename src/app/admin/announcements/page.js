"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus, Search, Megaphone, Trash2, Edit2, Pin, Clock, Calendar as CalendarIcon,
    AlertCircle, Users, CheckCircle2, ChevronDown, Loader2, X
} from "lucide-react"
import { useToast } from "@/components/Toast"

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

const PRIORITY_COLORS = {
    LOW: 'bg-slate-100 text-slate-600 border-slate-200',
    NORMAL: 'bg-blue-50 text-blue-700 border-blue-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    URGENT: 'bg-red-50 text-red-700 border-red-200 shadow-sm'
}

export default function AdminAnnouncements() {
    const toast = useToast()
    const [announcements, setAnnouncements] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [csrfToken, setCsrfToken] = useState(null)
    
    // Modal state
    const [showForm, setShowForm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'NORMAL',
        departmentId: '',
        isPinned: false,
        startsAt: new Date().toISOString().slice(0, 16),
        expiresAt: ''
    })

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [annRes, deptRes] = await Promise.all([
                fetch('/api/admin/announcements?active=false'),
                fetch('/api/admin/departments')
            ])
            
            if (annRes.ok) {
                const data = await annRes.json()
                setAnnouncements(data.announcements || [])
            }
            if (deptRes.ok) {
                const data = await deptRes.json()
                setDepartments(data.departments || [])
            }
        } catch (e) {
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenForm = (announcement = null) => {
        if (announcement) {
            setEditingId(announcement.id)
            setFormData({
                title: announcement.title,
                content: announcement.content,
                priority: announcement.priority,
                departmentId: announcement.departmentId || '',
                isPinned: announcement.isPinned,
                startsAt: announcement.startsAt ? new Date(announcement.startsAt).toISOString().slice(0, 16) : '',
                expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : ''
            })
        } else {
            setEditingId(null)
            setFormData({
                title: '',
                content: '',
                priority: 'NORMAL',
                departmentId: '',
                isPinned: false,
                startsAt: '',
                expiresAt: ''
            })
        }
        setShowForm(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        try {
            const payload = {
                ...formData,
                departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
                expiresAt: formData.expiresAt || null
            }
            
            if (editingId) payload.id = editingId
            
            const res = await fetch('/api/admin/announcements', {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify(payload)
            })
            
            if (res.ok) {
                toast.success(editingId ? 'Announcement updated' : 'Announcement created and broadcasted')
                setShowForm(false)
                fetchData()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to save announcement')
            }
        } catch (e) {
            toast.error('Network error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return
        
        try {
            const res = await fetch(`/api/admin/announcements?id=${id}`, {
                method: 'DELETE',
                headers: { ...(csrfToken && { 'x-csrf-token': csrfToken }) }
            })
            
            if (res.ok) {
                toast.success('Announcement deleted')
                fetchData()
            }
        } catch (e) {
            toast.error('Failed to delete')
        }
    }

    const toggleActiveStatus = async (id, currentStatus) => {
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({ id, isActive: !currentStatus })
            })
            
            if (res.ok) {
                fetchData()
            }
        } catch (e) {}
    }

    const filtered = announcements.filter(a => 
        !search || 
        a.title.toLowerCase().includes(search.toLowerCase()) || 
        a.content.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Announcements</h1>
                    <p className="text-slate-500 mt-1">Broadcast messages to the entire company or specific departments</p>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" />
                    New Announcement
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search announcements..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                    <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No announcements found</h3>
                    <p className="text-slate-500 text-sm mb-6">Keep your team informed by creating announcements.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(announcement => {
                        const now = new Date()
                        const starts = new Date(announcement.startsAt)
                        const expires = announcement.expiresAt ? new Date(announcement.expiresAt) : null
                        const isScheduled = starts > now
                        const isExpired = expires && expires < now
                        
                        let statusColor = "bg-green-100 text-green-700"
                        let statusText = "Active"
                        
                        if (!announcement.isActive) { statusColor = "bg-slate-100 text-slate-600"; statusText = "Draft/Inactive" }
                        else if (isExpired) { statusColor = "bg-red-100 text-red-700"; statusText = "Expired" }
                        else if (isScheduled) { statusColor = "bg-amber-100 text-amber-700"; statusText = "Scheduled" }
                        
                        return (
                            <div key={announcement.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden">
                                {announcement.isPinned && (
                                    <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 p-2 rounded-bl-xl border-b border-l border-blue-100">
                                        <Pin className="w-4 h-4 fill-current" />
                                    </div>
                                )}
                                
                                <div className="flex gap-2 mb-3 pr-8">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${PRIORITY_COLORS[announcement.priority]}`}>
                                        {announcement.priority}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </div>
                                
                                <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2">{announcement.title}</h3>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-1">{announcement.content}</p>
                                
                                <div className="space-y-2 mt-auto pt-4 border-t border-slate-50 text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-3 h-3" />
                                        {announcement.department ? announcement.department.name : 'All Departments'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-3 h-3" />
                                        {starts.toLocaleDateString()} {expires ? ` - ${expires.toLocaleDateString()}` : ' (No expiry)'}
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => toggleActiveStatus(announcement.id, announcement.isActive)} className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors" title={announcement.isActive ? "Deactivate" : "Activate"}>
                                        {announcement.isActive ? <X className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleOpenForm(announcement)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(announcement.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pb-28 overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 mt-16">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
                                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Announcement' : 'New Announcement'}</h2>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                                    <input type="text" required maxLength={200} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Announcement subject" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                                    <textarea required rows={6} maxLength={5000} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Type your message here..." />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                        <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white">
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Department</label>
                                        <select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white">
                                            <option value="">All Company</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Schedule Publish Time (Optional)</label>
                                        <input type="datetime-local" value={formData.startsAt} onChange={e => setFormData({...formData, startsAt: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Time (Optional)</label>
                                        <input type="datetime-local" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none" />
                                    </div>
                                </div>
                                
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <input type="checkbox" checked={formData.isPinned} onChange={e => setFormData({...formData, isPinned: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 flex items-center gap-1"><Pin className="w-3 h-3" /> Pin Announcement</p>
                                        <p className="text-xs text-slate-500">Pinned announcements stay at the top of the feed</p>
                                    </div>
                                </label>
                                
                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex justify-center items-center gap-2 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                                        {editingId ? 'Update' : 'Publish Announcement'}
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
