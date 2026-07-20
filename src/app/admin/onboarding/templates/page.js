"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ListChecks, ArrowLeft, Loader2, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/Toast"

const TASK_CATEGORIES = [
    { value: 'DOCUMENT', label: 'Document Submission' },
    { value: 'IT_SETUP', label: 'IT Setup & Access' },
    { value: 'TRAINING', label: 'Training Module' },
    { value: 'POLICY_ACK', label: 'Policy Acknowledgement' },
    { value: 'BUDDY', label: 'Buddy Assignment' },
    { value: 'WELCOME', label: 'Welcome & Introductions' }
]

const ROLES = [
    { value: 'EMPLOYEE', label: 'New Employee' },
    { value: 'ADMIN', label: 'HR / Admin' },
    { value: 'MANAGER', label: 'Manager' }
]

export default function OnboardingTemplatesPage() {
    const toast = useToast()
    const [templates, setTemplates] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    
    const [formData, setFormData] = useState({
        name: '',
        departmentId: '',
        tasks: [{ title: '', description: '', category: 'WELCOME', assignedRole: 'EMPLOYEE', dueInDays: 1, isRequired: true }]
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const [templatesRes, deptsRes] = await Promise.all([
                fetch('/api/admin/onboarding/templates'),
                fetch('/api/admin/departments')
            ])
            
            if (templatesRes.ok) {
                const data = await templatesRes.json()
                setTemplates(data.templates || [])
            }
            if (deptsRes.ok) {
                const data = await deptsRes.json()
                setDepartments(data.departments || [])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddTask = () => {
        setFormData({
            ...formData,
            tasks: [...formData.tasks, { title: '', description: '', category: 'WELCOME', assignedRole: 'EMPLOYEE', dueInDays: 1, isRequired: true }]
        })
    }

    const handleRemoveTask = (index) => {
        const newTasks = [...formData.tasks]
        newTasks.splice(index, 1)
        setFormData({ ...formData, tasks: newTasks })
    }

    const handleTaskChange = (index, field, value) => {
        const newTasks = [...formData.tasks]
        newTasks[index] = { ...newTasks[index], [field]: value }
        setFormData({ ...formData, tasks: newTasks })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch('/api/admin/onboarding/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (data.success) {
                toast?.success('Template created successfully')
                setShowForm(false)
                setFormData({ name: '', departmentId: '', tasks: [{ title: '', description: '', category: 'WELCOME', assignedRole: 'EMPLOYEE', dueInDays: 1, isRequired: true }] })
                fetchData()
            } else {
                toast?.error(data.error || 'Failed to create template')
            }
        } catch (error) {
            toast?.error('An unexpected error occurred')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Onboarding Templates</h1>
                    <p className="text-slate-500">Standardize the day 1 experience for new hires</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create Template
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {showForm ? (
                    <motion.form
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        onSubmit={handleSubmit}
                        className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8"
                    >
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <h2 className="text-xl font-bold text-slate-900">New Template</h2>
                            <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-700">Cancel</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Template Name *</label>
                                <input 
                                    type="text" required
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Standard Engineering Onboarding"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Target Department (Optional)</label>
                                <select 
                                    value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">Task List</h3>
                                <button type="button" onClick={handleAddTask} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Add Task
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {formData.tasks.map((task, index) => (
                                    <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                                        {formData.tasks.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveTask(index)} className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-5">
                                                <input 
                                                    type="text" required placeholder="Task Title"
                                                    value={task.title} onChange={e => handleTaskChange(index, 'title', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <select 
                                                    value={task.category} onChange={e => handleTaskChange(index, 'category', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                                >
                                                    {TASK_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <select 
                                                    value={task.assignedRole} onChange={e => handleTaskChange(index, 'assignedRole', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                                >
                                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 flex items-center gap-2">
                                                <span className="text-xs text-slate-500 whitespace-nowrap">Due Day</span>
                                                <input 
                                                    type="number" min="0" required
                                                    value={task.dueInDays} onChange={e => handleTaskChange(index, 'dueInDays', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="md:col-span-12">
                                                <input 
                                                    type="text" placeholder="Description / Instructions (Optional)"
                                                    value={task.description} onChange={e => handleTaskChange(index, 'description', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button 
                                type="submit" disabled={saving}
                                className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Save Template
                            </button>
                        </div>
                    </motion.form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {loading ? (
                            <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                        ) : templates.length === 0 ? (
                            <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200">
                                <ListChecks className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-900 mb-2">No Templates</h3>
                                <p className="text-slate-500 mb-6">Create an onboarding template to get started.</p>
                                <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700">
                                    Create Template
                                </button>
                            </div>
                        ) : (
                            templates.map(template => (
                                <div key={template.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{template.name}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                                            {template.department?.name || 'All Departments'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-700 border-t border-slate-100 pt-4 flex justify-between items-center">
                                        <span>{template._count.tasks} Tasks</span>
                                        <button className="text-blue-600 hover:text-blue-700 text-xs">Edit</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
