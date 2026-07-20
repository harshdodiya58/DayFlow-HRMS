'use client'

import { useState, useEffect } from 'react'
import { Plus, Settings, AlertCircle } from 'lucide-react'

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        type: 'LEAVE',
        departmentId: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [wfRes, deptRes] = await Promise.all([
                fetch('/api/admin/workflows'),
                fetch('/api/admin/departments')
            ])
            const [wfData, deptData] = await Promise.all([
                wfRes.json(), deptRes.json()
            ])
            if (wfData.success) setWorkflows(wfData.workflows)
            if (deptData.success) setDepartments(deptData.departments)
        } catch (error) {
            console.error('Failed to fetch data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/admin/workflows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowForm(false)
                setFormData({ name: '', type: 'LEAVE', departmentId: '' })
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Approval Workflows</h1>
                    <p className="text-white/60 mt-2">Manage routing for leaves, expenses, and appraisals.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    New Workflow
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSave} className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                    <h3 className="text-xl font-bold text-white mb-4">Create Workflow</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-white/70 font-medium mb-2">Workflow Name</label>
                            <input 
                                required placeholder="e.g. Standard Leave Routing"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-white/70 font-medium mb-2">Request Type</label>
                            <select 
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="LEAVE">Leave Request</option>
                                <option value="EXPENSE">Expense Claim</option>
                                <option value="APPRAISAL">Appraisal</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-white/70 font-medium mb-2">Department (Optional)</label>
                            <select 
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                value={formData.departmentId}
                                onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                            >
                                <option value="">Global (All Departments)</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-white/70 hover:bg-white/5 rounded-xl font-medium transition">Cancel</button>
                        <button type="submit" className="bg-white text-black px-8 py-2 rounded-xl font-bold hover:bg-gray-200 transition">Create Workflow</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />)
                ) : (
                    workflows.map(wf => (
                        <div key={wf.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-blue-400" />
                                    {wf.name}
                                </h3>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white">
                                    {wf.type}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm text-white/70 pt-2 border-t border-white/10">
                                <div className="flex justify-between">
                                    <span>Scope:</span>
                                    <span className="font-bold text-white">{wf.department ? wf.department.name : 'Global'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
