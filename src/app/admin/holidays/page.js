"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Calendar as CalendarIcon, Plus, Trash2, Edit2, Loader2, X, 
    ChevronLeft, ChevronRight, Sun, Snowflake, MapPin, Search
} from "lucide-react"
import { useToast } from "@/components/Toast"

const HOLIDAY_TYPES = ['NATIONAL', 'STATE', 'RELIGIOUS', 'COMPANY']

export default function AdminHolidays() {
    const toast = useToast()
    const [holidays, setHolidays] = useState([])
    const [loading, setLoading] = useState(true)
    const [year, setYear] = useState(new Date().getFullYear())
    const [search, setSearch] = useState('')
    const [csrfToken, setCsrfToken] = useState(null)
    
    // Modal state
    const [showForm, setShowForm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        type: 'NATIONAL',
        description: '',
        isOptional: false,
        locations: ''
    })

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchHolidays(year)
    }, [year])

    const fetchHolidays = async (selectedYear) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/holidays?year=${selectedYear}`)
            if (res.ok) {
                const data = await res.json()
                setHolidays(data.holidays || [])
            }
        } catch (e) {
            toast.error('Failed to load holidays')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenForm = (holiday = null) => {
        if (holiday) {
            setEditingId(holiday.id)
            setFormData({
                name: holiday.name,
                date: new Date(holiday.date).toISOString().split('T')[0],
                type: holiday.type,
                description: holiday.description || '',
                isOptional: holiday.isOptional,
                locations: holiday.locations?.join(', ') || ''
            })
        } else {
            setEditingId(null)
            setFormData({
                name: '',
                date: '',
                type: 'NATIONAL',
                description: '',
                isOptional: false,
                locations: ''
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
                locations: formData.locations ? formData.locations.split(',').map(l => l.trim()) : []
            }
            
            if (editingId) payload.id = editingId
            
            const res = await fetch('/api/admin/holidays', {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify(payload)
            })
            
            if (res.ok) {
                toast.success(editingId ? 'Holiday updated' : 'Holiday added')
                setShowForm(false)
                fetchHolidays(year)
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to save holiday')
            }
        } catch (e) {
            toast.error('Network error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return
        
        try {
            const res = await fetch(`/api/admin/holidays?id=${id}`, {
                method: 'DELETE',
                headers: { ...(csrfToken && { 'x-csrf-token': csrfToken }) }
            })
            
            if (res.ok) {
                toast.success('Holiday deleted')
                fetchHolidays(year)
            }
        } catch (e) {
            toast.error('Failed to delete')
        }
    }

    const filtered = holidays.filter(h => 
        !search || 
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.type.toLowerCase().includes(search.toLowerCase())
    )

    // Group holidays by month
    const groupedHolidays = filtered.reduce((acc, holiday) => {
        const month = new Date(holiday.date).toLocaleString('default', { month: 'long' })
        if (!acc[month]) acc[month] = []
        acc[month].push(holiday)
        return acc
    }, {})

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Holiday Calendar</h1>
                    <p className="text-slate-500 mt-1">Manage company holidays and off-days</p>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Holiday
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 border-r pr-4">
                    <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <span className="text-xl font-bold text-slate-900 w-16 text-center">{year}</span>
                    <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
                
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search holidays..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div className="text-sm text-slate-500 ml-auto font-medium">
                    Total: {holidays.length} Holidays
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : Object.keys(groupedHolidays).length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                    <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No holidays found for {year}</h3>
                    <p className="text-slate-500 text-sm mb-6">Add holidays to populate the company calendar.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedHolidays).map(([month, monthHolidays]) => (
                        <div key={month} className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                {month}
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {monthHolidays.map(holiday => {
                                    const date = new Date(holiday.date)
                                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                                    const dayNum = date.getDate()
                                    
                                    return (
                                        <div key={holiday.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow group flex items-start gap-4">
                                            <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 w-14 h-14 rounded-xl flex-shrink-0">
                                                <span className="text-sm font-bold uppercase">{dayName}</span>
                                                <span className="text-xl font-black leading-none">{dayNum}</span>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-bold text-slate-900 truncate pr-2">{holiday.name}</h4>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleOpenForm(holiday)} className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(holiday.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                        holiday.type === 'NATIONAL' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        holiday.type === 'STATE' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        holiday.type === 'RELIGIOUS' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                        {holiday.type}
                                                    </span>
                                                    {holiday.isOptional && (
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                                                            OPTIONAL
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {holiday.description && (
                                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{holiday.description}</p>
                                                )}
                                                
                                                {holiday.locations && holiday.locations.length > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="truncate">{holiday.locations.join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pb-28 overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 mt-16">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
                                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Holiday' : 'Add Holiday'}</h2>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Holiday Name *</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                                        <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                                        <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500">
                                            {HOLIDAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Locations (Comma separated, empty for all)</label>
                                    <input type="text" value={formData.locations} onChange={e => setFormData({...formData, locations: e.target.value})} placeholder="e.g. Mumbai, Delhi, Bangalore" className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <input type="checkbox" checked={formData.isOptional} onChange={e => setFormData({...formData, isOptional: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Optional Holiday (Restricted)</p>
                                        <p className="text-xs text-slate-500">Employees can choose to take this leave from their restricted quota</p>
                                    </div>
                                </label>
                                
                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex justify-center items-center gap-2 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Holiday'}
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
